import { Route,Routes } from 'react-router-dom';

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
        <ProtectedRoute>
        <AdminPage/>
      </ProtectedRoute>} />

      <Route path='/student' element={
        <ProtectedRoute>
          <StudentPage/>
        </ProtectedRoute>}/>

      <Route path='staff' element={
        <ProtectedRoute>
          <StaffPage/>
        </ProtectedRoute>} />

      <Route path='/calendar' element={<AcademicCalendar/>} />
      <Route path='/shuttle' element={<ShuttleHours/>}/>
      
      </Routes>
      
   );
}

export default App;
