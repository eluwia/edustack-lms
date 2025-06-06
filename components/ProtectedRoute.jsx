import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/auth";
import { Navigate } from "react-router-dom";
import { getDoc,doc,getFirestore } from "firebase/firestore";
import { useEffect,useState } from "react";

function ProtectedRoute({children, rolesAllowed}) {
    const [user,setUser] = useState(null);
    const [role,setRole] =useState(null);
    const [loading,setLoading] =useState(true);

    const db=getFirestore();

    useEffect(()=> {
        const unsubscribe = onAuthStateChanged(auth,async (firebaseUser)=> {
            if (firebaseUser) {
                setUser(firebaseUser);
                const docRef = doc(db,"roles",firebaseUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRole(docSnap.data().role);
                }
            }
                else {
                    setUser(null);
                    setRole(null);
                }
                setLoading(false);
            });
            return () => unsubscribe();
        }, []);
        if (loading) return <div className="text-center text-s mt-50">Loading..</div>;

        if (!user || !rolesAllowed.includes(role)) {
            return <Navigate to ="/" replace />;
        }
        return children;
    }
export default ProtectedRoute;