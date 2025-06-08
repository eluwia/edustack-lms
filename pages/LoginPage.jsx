import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";

import '../src/index.css';

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
            description: "Check and filter shuttle hours.",
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
        <div className="relative h-screen w-full flex items-center justify-center overflow-hidden p-6">
                <div className="aurora-background"></div>
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 h-7xl max-w-7xl w-full z-10">
                {/* sol taraftaki kart login formu */}
                <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col justify-center">
                    <h1 className="text-3xl text-gray-600 mb-2">Welcome to
                                            <span className=" font-weight-500 text-6xl font-medium text-gray-600 mb-2  "> EduStack</span>
                    </h1>
                    <p className="text-gray-500 pt-0 pb-6 ml-2 text-base  mb-6">Please login to continue</p>
                    <form onSubmit={handleLogin} className="space-y-4 flex flex-col items-center justify-center">
                        <input 
                        type="email"
                        placeholder="University mail"
                        className="w-full p-3 rounded-full block bg-gray-400/60  border-gray-520/50"
                        onChange={(e)=>setEmail(e.target.value)}
                        required/>
                        
                        <input
                        type="password"
                        placeholder="Password"
                        className=" w-full p-3 rounded-full block bg-gray-400/60 border-gray-200/50"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required/>
                        <button
                        type="submit"
                        className="w-140  h-12 p-3 bg-gray-600 text-white/80 rounded-full hover:bg-gray-700 transition"
                        >
                        Login
                        </button>
                    </form>

                </div>

                {/* sağ taraftaki calendar ve shuttle kısmı */}
                <div className="relative backdrop-blur-md rounded-3xl shadow-xl overflow-hidden flex flex-col justify-between h-140" >
                    <img src={cards[currentCard].image}
                    alt="card visual"
                    className="w-full h-full rounded-t-3xl"
                    />
                <div className="-mt-3 rounded-full">
                    <div className="bg-white/70 backdrop-blur-md p-4 rounded-lg shadow-md mb-4 flex justify-items-stretch h-30">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mt-3">{cards[currentCard].title}</h2>
                    <h5 className="text-gray-600 text-sm ">{cards[currentCard].description}</h5>
                    </div>
                    
                    <a href={cards[currentCard].link} className="absolute right-10 mt-7 font-medium underline">
                        Visit Page →
                    </a>
                    </div>
                </div>

               <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
            {cards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentCard(idx)}
                className={`w-3 h-3 rounded-full transition ${
                  idx === currentCard ? "bg-gray-600" : "bg-gray-400  "
                }`}
              />
            ))}
          </div>

                </div>
            </div>
        </div>
    );

}


export default LoginPage;