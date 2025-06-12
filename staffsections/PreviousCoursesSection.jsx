import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/config";

export default function PastCoursesSection() {
  const [pastCoursesDetails, setPastCoursesDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchPastCourses = async () => {
      setLoading(true);
      try {
        // 1) instructors'dan instructor verisini al
        const instRef = doc(db, "instructors", user.uid);
        const instSnap = await getDoc(instRef);
        if (!instSnap.exists()) {
          console.log("Instructor data not found");
          setLoading(false);
          return;
        }
        const instructor = instSnap.data();
        const instructorName = instructor.name.toLowerCase();
        const pastCoursesCodes = instructor.pastcourses || [];
        if (pastCoursesCodes.length === 0) {
          console.log("No past courses found");
          setLoading(false);
          return;
        }

        // 2) courses koleksiyonundaki derslerin tamamını al
        const coursesCol = collection(db, "courses");
        const coursesSnap = await getDocs(coursesCol);
        const allCourses = coursesSnap.docs.map(doc => doc.data());

        // 3) pastcourses ve instructor adıyla filtrele
        const filteredCourses = allCourses.filter(course => {
          if (!course.instructor || !course.course_code) return false;
          const courseInstructorName = course.instructor.toLowerCase();
          // sadece instructor adı ile eşleşme
          const instructorMatch = courseInstructorName.includes(instructorName);
          // pastcourses listesinde ders kodu varsa
          const courseCodeMatch = pastCoursesCodes.includes(course.course_code);
          return instructorMatch && courseCodeMatch;
        });

        setPastCoursesDetails(filteredCourses);
      } catch (error) {
        console.error("Error fetching past courses:", error);
      }
      setLoading(false);
    };

    fetchPastCourses();
  }, [user]);

  if (loading) return <div>Loading past courses...</div>;

  if (pastCoursesDetails.length === 0)
    return <div>No past courses found for this instructor.</div>;

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in max-h-[600px] overflow-y-scroll scrollbar-hide">
      {pastCoursesDetails.map((course, index) => (
        <div
          key={index}
          className="bg-gray-500 p-4 rounded-lg shadow-md border border-gray-200"
        >
          <h3 className="text-lg font-semibold mb-2">{course.course_code}</h3>
          <p>Instructor: {course.instructor}</p>
          <p>Credits: {course.credit}</p>
          <p>Semester: {course.semester}</p>
          <p>Section: {course.section}</p>
          <p>Section GPA: {course.section_gpa}</p>
          {/* İstersen burada daha fazla detay ekleyebilirsin */}
        </div>
      ))}
    </div>
  );
}
