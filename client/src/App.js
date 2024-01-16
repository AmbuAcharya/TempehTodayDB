import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult } from '@firebase/auth';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AppBar from './components/AppBar';
import CreateUser from './screens/CreateUser';
import Footer from './components/Footer';
import Home from './screens/Home';
import Login from './screens/Login';
import { get, ref } from 'firebase/database';
import { auth, db } from './firebaseConfig';
import AppIcon from "./app_icon.png";

const LoadingSpinner = () => (
  <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-700 bg-opacity-50 z-20">
    <div className="bg-white p-4 rounded-md flex items-center justify-center">
      <img
        src={AppIcon}
        alt="App Logo"
        className="animate-spin h-12 w-12"
      />
    </div>
  </div>
);
const App = () => {
  const [isUserLoggedIn, setUserLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [Message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUserLoggedIn(!!user);

      if (user) {
        try {
          const idTokenResult = await getIdTokenResult(auth.currentUser);
          setIsAdmin(!!idTokenResult.claims.admin);

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

    return () => unsubscribe();
  }, []);

  const AdminRoute = ({ element }) => (isAdmin ? element : <Navigate to="/login" />);

  return (
    <Router>
      <>
        {loading && <LoadingSpinner />}

        <div className="App bg-yellow-200 min-h-screen flex flex-col relative">
          <div className="flex-grow flex flex-col">
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
                element={<Home setErrorMessage={setErrorMessage} setMessage={setMessage} setLoading={setLoading} />}
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
          </div>

          <div className="container mx-auto text-center absolute bottom-12 w-full z-10">
            {errorMessage && (
              <p className="text-center font-bold text-red-600 text-2xl my-4">{errorMessage}</p>
            )}
            {Message && (
              <p className="text-center font-bold text-black text-2xl my-4">{Message}</p>
            )}
          </div>

          <Footer />
        </div>
      </>
    </Router>
  );
};

export default App;