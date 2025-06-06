import { signOut } from "firebase/auth";
import { auth } from "../firebase/auth";
import { useNavigate } from "react-router-dom";

function HandleLogout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        signOut(auth).then(() => {navigate("/");})
        .catch((error) => {
            console.error("Unable to logout:",error);
            alert("Unable to logout.")
        });
    };
    return(
        <button onClick={handleLogout} className=" bg-gray-200/50 text-gray-700 font-medium shadow-md shadow-gray-200 rounded hover:bg-gray-400/50">Logout</button>
    );
}

export default HandleLogout;