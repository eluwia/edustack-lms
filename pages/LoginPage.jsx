import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";

import busimg from "../src/assets/busimg.gif";
import calendarimg from "../src/assets/calendarimg.jpg";


function LoginPage() {

    //hold user info
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    //right-side current card state
    const [currentCard, setCurrentCard] = useState(0);

    //navigate user based on roles in firestore
    const navigate = useNavigate();
    const db = getFirestore();

    //shuttle and calendar cards on the right side
    const cards = [

        {
            title: "Academic Calendar",
            description: "View academic dates and deadlines.",
            image: calendarimg,
            link: "/calendar",
        },
        {
            title: "Shuttle Hours",
            description: "Check and filter shuttle and ring services",
            image: busimg,
            link: "/shuttle",
        },

    ];

    //async function for user roles
    const handleLogin = async (e) => {
        //prevent reload
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
            const roleDocument = await getDoc(doc(db, "roles", uid));
            if (roleDocument.exists()) {
                const role = roleDocument.data().role;
                if (role === "admin") navigate("/admin");
                else if (role === "staff") navigate("/staff");
                else navigate("/student");
            } else {
                alert("Unable to find user role.");
            }
        }
        catch (error) {
            console.error(error);
            alert("Unable to login.");
        }
    };

    return (
        <div/>
    );

}


export default LoginPage;