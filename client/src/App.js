import { onAuthStateChanged, getIdTokenResult } from '@firebase/auth';
import React, { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AppBar from './components/AppBar';
import CreateUser from './screens/CreateUser';
import Footer from './components/Footer';
import { auth, db } from './firebaseConfig';
import Home from './screens/Home';
import Login from './screens/Login';
import { get, ref } from 'firebase/database';

const App = () => {
  const [isUserLoggedIn, setUserLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUserLoggedIn(!!user);

      if (user) {
        try {
          // Check admin status using custom claims
          const idTokenResult = await getIdTokenResult(auth.currentUser);
          setIsAdmin(!!idTokenResult.claims.admin);

          // Alternatively, check admin status using Realtime Database
          const uid = auth.currentUser.uid;
          const userSnapshot = await get(ref(db, `users/${uid}`));
          const userData = userSnapshot.val();

          if (userData && userData.isAdmin) {
            setIsAdmin(true);
          }
        } catch (error) {
          console.error('Error getting ID token:', error.message);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const AdminRoute = ({ element }) => {
    return isAdmin ? element : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="App bg-yellow-200 min-h-screen flex flex-col">
        <AppBar isUserLoggedIn={isUserLoggedIn} isAdmin={isAdmin} />
        <Routes>
          <Route
            path="/login"
            element={
              isUserLoggedIn ? <Navigate to="/home" /> : <Login setUserLoggedIn={setUserLoggedIn} />
            }
          />
          <Route
            path="/home"
            element={isUserLoggedIn ? <Home /> : <Navigate to="/login" />}
          />
          <Route
            path="/create"
            element={<AdminRoute element={<CreateUser />} />}
          />
          <Route
            path="/"
            element={<Navigate to={isUserLoggedIn ? '/home' : '/login'} />}
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
