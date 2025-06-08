import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config.js";
import { getAuth } from "firebase/auth";
import "../src/index.css";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import {Chart as ChartJS, ArcElement, Tooltip, Legend} from "chart.js/auto";
import { Doughnut } from "react-chartjs-2"; 
import { data } from "react-router-dom";

ChartJS.register(
    ArcElement,Tooltip,Legend
);




export default function ProfileSection({ setFullname, setFname }) {



  const [showWelcome, setShowWelcome] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [showProfileContent, setShowProfileContent] = useState(false);

  const [notes, setNotes] = useState([]);
  const [editedNotes, setEditedNotes] = useState([]);
  const [editing, setEditing] = useState(false);

  const [department, setDepartment] = useState("");
  const [program, setProgram] = useState("");
  const [year, setYear] = useState(0);
  const [term, setTerm] = useState("");
  const [creditscompleted, setCredit] = useState(0);

  const [student, setStudent] = useState(null);

      const storage = getStorage();




  useEffect(() => {
    const fetchStudent = async () => {

        
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, "student"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();

        setStudent({ ...data, docId: docSnap.id });
        setFullname(data.fullname);
        setFname(data.fname);
        setYear(data.year);
        setDepartment(data.department);
        setProgram(data.program);
        setNotes(data.notes || []);
        setEditedNotes(data.notes || []);
        setCredit(data.creditscompleted);

        const photoUrl = await fetchProfilePhoto(user.uid);
setStudent({ ...data, docId: docSnap.id, profilePictureUrl: photoUrl });
        
      

        if (data.year === 4) setTerm("Senior");
        else if (data.year === 3) setTerm("Junior");
        else if (data.year === 2) setTerm("Sophomore");
        else setTerm("Freshman");
      }
    };


    fetchStudent();
  }, [setFullname, setFname]);

  const fetchProfilePhoto = async (uid) => {
  try {
    const photoRef = ref(storage, `profilePictures/${uid}.JPG`);
    const url = await getDownloadURL(photoRef);
    return url;
  } catch (error) {
    console.error("Fotoğraf alınamadı:", error);
    return null;
  }
};


  useEffect(() => {
    const fadeDelay = setTimeout(() => setIsFading(true), 2000);
    const hideDelay = setTimeout(() => {
      setShowWelcome(false);
      setShowProfileContent(true);
    }, 4000);
    return () => {
      clearTimeout(fadeDelay);
      clearTimeout(hideDelay);
    };
  }, []);

  
  const handleSaveNotes = async () => {
    if (!student || !student.docId) return;
    try {
      const studentRef = doc(db, "student", student.docId);
      await updateDoc(studentRef, {
        notes: editedNotes,
      });
      setNotes(editedNotes);
      setEditing(false);
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  };

  const handleAddNote = () => {
    const updated = [...editedNotes, ""];
    setEditedNotes(updated);
  };

  if (!student) {
    return <div className="p-8 text-xl"></div>;
  }

  
 const chartdata = {
  labels: ['Credits completed  ', 'Credits to complete'],
  datasets: [
    {
      
      label: 'Graduation Progress Bar',
      data:  [creditscompleted, 240 - creditscompleted],
      backgroundColor: ['rgba(75, 81, 157, 0.8)',
        'rgba(37, 73, 141, 0.38)',

      ],
      borderColor: ['rgba(75, 81, 157, 0.04)',
        'rgba(37, 73, 141, 0.02)',

      ],
      borderWidth: 1,
    },
  ],
};

  return (
    <div className="h-full w-full flex flex-col px-10 pt-10 transition-all items-center">
      {showWelcome && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <h1
            className={`text-3xl font-light text-gray-700 transition-opacity duration-2000 ease-in-out ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            Welcome to EduStack, <span className="font-medium">{student.fname}</span>
          </h1>
        </div>
      )}

      {showProfileContent && (
        <div className="animate-fade-in w-full flex flex-col items-center -ml-50  ">
          <div className="flex mb-12 items-start gap-6 w-full max-w-6xl">
           <img src={student.profilePictureUrl || "/default-profile.png"} className="shadow-xl border border-gray-300/90 opacity-90 w-20 h-20 rounded-full" alt="profile" />



            <div>
                
              <p className="text-gray-700 text-3xl mb-1 font-semibold">
                Welcome {student.fname}
              </p>
              <p className="text-gray-700 mb-3">
                You can update your notes, check announcements and deadlines.
              </p>

              <div className="flex gap-3  text-white text-sm font-medium">
                <span className="bg-gray-400/80 px-4 font-light text-base py-1 rounded-full">
                  {term} student
                </span>
                <span className="bg-gray-500/80 font-light text-base px-4 py-1 rounded-full">
                  {department}
                </span>
                <span className="bg-gray-600/80 font-light text-base px-4 py-1 rounded-full">
                  {program}
                </span>
                
              </div>
            </div>
          
          </div>
          <div className="absolute -ml-210 gap-4 mt-40 ">
  <h2 className="text-md font-light text-gray-700 pb-3">Graduation Progress Bar</h2>
  <div className="w-60 h-60 -ml-10">
    <Doughnut data={chartdata} />
  </div>
  <p className="text-sm text-gray-600 -ml-2 mt-2 pt-2">{creditscompleted} / 240 credits completed</p>
</div>

         

          <div className="flex gap-10 w-full max-w-6xl ml-50 -mt-30 -mr-350">
            
            <div className="bg-gray-300/80 rounded-2xl shadow-md p-4 w-65 h-115 text-gray-800">
              <h2 className="text-lg font-semibold">Announcements</h2>
              <p className="text-sm mt-2">
                New internship positions have been added.
              </p>
            </div>

            <div className="flex flex-col gap-4 ">
              <div className="bg-gray-300/80 rounded-2xl shadow-md p-4 w-65 h-55 text-gray-800">
                <h2 className="text-lg font-semibold">Reminders</h2>
                <p className="text-sm mt-2">
                  Don't forget to enroll this week.
                </p>
              </div>
              <div className="flex w-full -mr-350">
                <div className="bg-gray-300/80 rounded-2xl shadow-md p-4 flex-1 text-gray-800 relative h-56">
                  <h2 className="text-lg font-semibold ">Notes</h2>
                  <div className=" items-center  text-sm text-gray-800">
                    <button
                      onClick={() => {
                        setEditedNotes(notes);
                        setEditing(!editing);
                      }}
                      className="hover:underline -mt-9 ml-15 absolute"
                    >
                      {editing ? "Cancel" : "Edit"}
                    </button>
                    {editing && (
                      <>
                        <button
                          onClick={handleAddNote}
                          className="hover:underline -mt-9 ml-30 absolute"
                          title="Add note"
                        >
                          Add
                        </button>
                        <button
                          onClick={handleSaveNotes}
                          className="hover:underline -mt-9 ml-40 absolute"
                        >
                          Save
                        </button>
                      </>
                    )}
                  </div>

                  <ul className="mt-2 space-y-2 text-sm max-h-32 overflow-y-auto scrollbar-hide pr-1">
                    {notes.length > 0 || editing ? (
                      editedNotes.map((note, index) => (
                        <li
                          key={index}
                          className="flex justify-between items-start gap-2"
                        >
                          {editing ? (
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              className="bg-white/70 w-full rounded px-2 py-1  outline-gray-300 focus:outline-blue-500"
                              onBlur={(e) => {
                                const updated = [...editedNotes];
                                updated[index] = e.target.innerText;
                                setEditedNotes(updated);
                              }}
                            >
                              {editedNotes[index]}
                            </div>
                          ) : (
                            <span>{note}</span>
                          )}
                          {editing && (
                            <button
                              onClick={() => {
                                const updated = [...editedNotes];
                                updated.splice(index, 1);
                                setEditedNotes(updated);
                              }}
                              className="text-red-600 text-xs hover:text-red-800"
                            >
                              🗑️
                            </button>
                          )}
                        </li>
                      ))
                    ) : (
                      <li className="italic text-gray-600">No notes available.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
