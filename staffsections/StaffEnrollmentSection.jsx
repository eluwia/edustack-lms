import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { getAuth } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

const tabs = ["Current", "Past", "Next"];
const CURRENT_YEAR = 2024;
const CURRENT_TERM = "S"; // Spring

const nextCoursesManual = [
  { course_code: "CS401", term: "Fall", year_start: 2025 },
  { course_code: "CS402", term: "Fall", year_start: 2025 },
];

const StaffEnrollmentSection = () => {
  const [activeTab, setActiveTab] = useState("Current");
  const [allPredictions, setAllPredictions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instructorName, setInstructorName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const uid = user.uid;

        // Adımı çek
        const instructorRef = doc(db, "instructors", uid);
        const instructorSnap = await getDoc(instructorRef);
        if (!instructorSnap.exists()) {
          console.warn("Instructor not found");
          setLoading(false);
          return;
        }

        const { name } = instructorSnap.data();
        setInstructorName(name);

        const predictionsColName = name.toLowerCase() + "predictions";
        const predictionsSnap = await getDocs(collection(db, predictionsColName));

        const predictions = predictionsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAllPredictions(predictions);
      } catch (error) {
        console.error("Error loading predictions:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filteredList = [];

    if (activeTab === "Current") {
      filteredList = allPredictions.filter(
        (p) => p.term === CURRENT_TERM && p.year_start === CURRENT_YEAR
      );
    } else if (activeTab === "Past") {
      filteredList = allPredictions.filter(
        (p) =>
          p.year_start < CURRENT_YEAR ||
          (p.year_start === CURRENT_YEAR && p.term !== CURRENT_TERM)
      );
    } else if (activeTab === "Next") {
      filteredList = allPredictions.filter((p) =>
        nextCoursesManual.some(
          (c) =>
            c.course_code === p.course_code &&
            c.term === p.term &&
            c.year_start === p.year_start
        )
      );
    }

    setFiltered(filteredList);
  }, [activeTab, allPredictions]);

  return (
    <div className="p-6 max-h-screen overflow-y-auto animate-fade-in">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Enrollment Predictions for {instructorName}
      </h2>

      <div className="flex gap-3 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading predictions...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No prediction data for "{activeTab}" tab.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="bg-white shadow rounded-xl p-4 border border-gray-100"
            >
              <p className="text-lg font-bold text-gray-800 mb-1">
                {course.course_code} ({course.term} {course.year_start})
              </p>
              <p><strong>Instructor:</strong> {course.instructor}</p>
              <p><strong>Actual:</strong> {course.total_enrolled}</p>
              <p><strong>Prediction:</strong> {parseFloat(course.Prediction).toFixed(2)}</p>
              <p><strong>Error:</strong> {parseFloat(course.Error).toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffEnrollmentSection;
