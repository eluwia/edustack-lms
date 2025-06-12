import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config.js";
import { getAuth } from "firebase/auth";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

export default function StaffProfileSection({ setFullname, setName }) {
  const [instructor, setInstructor] = useState(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingReminders, setEditingReminders] = useState(false);
  const [editedNotes, setEditedNotes] = useState([]);
  const [editedReminders, setEditedReminders] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [showProfileContent, setShowProfileContent] = useState(false);

  const storage = getStorage();

  useEffect(() => {
    const fetchInstructor = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, "instructors", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const photoUrl = await fetchProfilePhoto(user.uid);

          setInstructor({
            name: data.name || "",
            fullname: data.fullname || "",
            email: data.email || "",
            department: data.department || "",
            title: data.title || "",
            office: data.office || "",
            notes: data.notes || [],
            reminders: data.reminders || [],
            currentcourses: data.currentcourses || [],
            pastcourses: data.pastcourses || [],
            profilePictureUrl: photoUrl,
            docId: docSnap.id,
          });

          setEditedNotes(data.notes || []);
          setEditedReminders(data.reminders || []);
          setAnnouncements(data.announcements || []);

          // Burada fullname ve name'i dışarıdaki state'lere set ediyoruz:
          if (setFullname) setFullname(data.fullname || "");
          if (setName) setName(data.name || "");
        } else {
          console.error("Instructor document not found");
        }
      } catch (error) {
        console.error("Failed to fetch instructor:", error);
      }
    };

    fetchInstructor();
  }, [setFullname, setName]);

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

  const fetchProfilePhoto = async (uid) => {
    try {
      const photoRef = ref(storage, `profilePictures/${uid}.jpeg`);
      const url = await getDownloadURL(photoRef);
      return url;
    } catch (error) {
      console.error("Fotoğraf alınamadı:", error);
      return null;
    }
  };

  const saveNotes = async () => {
    if (!instructor?.docId) return;
    try {
      const ref = doc(db, "instructors", instructor.docId);
      await updateDoc(ref, { notes: editedNotes });
      setEditingNotes(false);
    } catch (error) {
      console.error("Notes güncellenemedi:", error);
    }
  };

  const saveReminders = async () => {
    if (!instructor?.docId) return;
    try {
      const ref = doc(db, "instructors", instructor.docId);
      await updateDoc(ref, { reminders: editedReminders });
      setEditingReminders(false);
    } catch (error) {
      console.error("Reminders güncellenemedi:", error);
    }
  };

  if (!instructor) return <div className="p-8 text-xl">Loading...</div>;

  return (
    <div className="h-full w-full flex flex-col px-10 pt-10 items-center">
      {showWelcome && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <h1
            className={`text-3xl font-light text-gray-700 transition-opacity duration-2000 ease-in-out ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            Welcome to EduStack,{" "}
            <span className="font-medium">{instructor.name}</span>
          </h1>
        </div>
      )}

      {showProfileContent && (
        <div className="animate-fade-in w-full max-w-6xl">
          <div className="flex mb-12 items-start gap-6">
            <img
              src={instructor.profilePictureUrl || "/default-profile.png"}
              className="shadow-xl border border-gray-300 w-21 h-21 rounded-full"
              alt="profile"
            />
            <div>
              <p className="text-gray-700 text-3xl mb-1 font-semibold">
                Welcome {instructor.name}
              </p>
              <p className="text-gray-700 mb-3">
                Manage your profile, notes, and reminders.
              </p>
              <div className="flex gap-3 text-white text-sm font-medium">
                <span className="bg-gray-400/80 px-4 py-1 rounded-full">
                  {instructor.title}
                </span>
                <span className="bg-gray-500/80 px-4 py-1 rounded-full">
                  {instructor.department}
                </span>
                <span className="bg-gray-600/80 px-4 py-1 rounded-full">
                  Office: {instructor.office}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Reminders */}
            <div className="bg-white rounded-2xl shadow-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-800">Reminders</h2>
                {editingReminders ? (
                  <button onClick={saveReminders} className="text-sm text-green-600 hover:underline">
                    Save
                  </button>
                ) : (
                  <button onClick={() => setEditingReminders(true)} className="text-sm text-blue-600 hover:underline">
                    Edit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {(editingReminders ? editedReminders : instructor.reminders)?.map((rem, i) => (
                  <div key={i} className="bg-gray-200 p-2 rounded relative">
                    {editingReminders ? (
                      <>
                        <input
                          type="text"
                          value={editedReminders[i]}
                          onChange={(e) => {
                            const updated = [...editedReminders];
                            updated[i] = e.target.value;
                            setEditedReminders(updated);
                          }}
                          className="w-full px-2 py-1 rounded text-sm"
                        />
                        <button
                          onClick={() => {
                            const updated = [...editedReminders];
                            updated.splice(i, 1);
                            setEditedReminders(updated);
                          }}
                          className="absolute top-1 right-2 text-red-500 text-sm"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <span>{rem}</span>
                    )}
                  </div>
                ))}
                {editingReminders && (
                  <button
                    onClick={() => setEditedReminders([...editedReminders, ""])}
                    className="text-xs text-blue-500 hover:underline col-span-2"
                  >
                    + Add Reminder
                  </button>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl shadow-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-800">Notes</h2>
                {editingNotes ? (
                  <button onClick={saveNotes} className="text-sm text-green-600 hover:underline">
                    Save
                  </button>
                ) : (
                  <button onClick={() => setEditingNotes(true)} className="text-sm text-blue-600 hover:underline">
                    Edit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {(editingNotes ? editedNotes : instructor.notes)?.map((note, i) => (
                  <div key={i} className="bg-gray-200 p-2 rounded relative">
                    {editingNotes ? (
                      <>
                        <input
                          type="text"
                          value={editedNotes[i]}
                          onChange={(e) => {
                            const updated = [...editedNotes];
                            updated[i] = e.target.value;
                            setEditedNotes(updated);
                          }}
                          className="w-full px-2 py-1 rounded text-sm"
                        />
                        <button
                          onClick={() => {
                            const updated = [...editedNotes];
                            updated.splice(i, 1);
                            setEditedNotes(updated);
                          }}
                          className="absolute top-1 right-2 text-red-500 text-sm"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <span>{note}</span>
                    )}
                  </div>
                ))}
                {editingNotes && (
                  <button
                    onClick={() => setEditedNotes([...editedNotes, ""])}
                    className="text-xs text-blue-500 hover:underline col-span-2"
                  >
                    + Add Note
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Announcements */}
          <div className="mt-8 w-full bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Announcements</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {announcements?.length > 0 ? (
                announcements.map((a, i) => <li key={i}>{a}</li>)
              ) : (
                <li>No announcements</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
