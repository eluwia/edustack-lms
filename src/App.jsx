import { Route,Routes } from 'react-router-dom';

import './index.css';

import LoginPage from '../pages/LoginPage';
import StaffPage from '../pages/StaffPage';
import AdminPage from '../pages/AdminPage';
import StudentPage from '../pages/StudentPage';
import ProtectedRoute from '../components/ProtectedRoute';
import AcademicCalendar from '../pages/AcademicCalendar';
import ShuttleHours from '../pages/ShuttleHours';

function App() {
  return (
    <Routes>

      <Route path='/' element={<LoginPage/>} />

      <Route path='/admin' element={
        <ProtectedRoute rolesAllowed={["admin"]}>
        <AdminPage/>
      </ProtectedRoute>} />

      <Route path='/student' element={
        <ProtectedRoute rolesAllowed={["student"]}>
          <StudentPage/>
        </ProtectedRoute>}/>

      <Route path='staff' element={
        <ProtectedRoute rolesAllowed={["staff"]}>
          <StaffPage/>
        </ProtectedRoute>} />

      <Route path='/calendar' element={<AcademicCalendar/>} />
      <Route path='/shuttle' element={<ShuttleHours/>}/>
      
      </Routes>
      
   );
}

export default App;
