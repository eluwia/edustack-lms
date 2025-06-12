import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/config";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export default function DemographicsSection() {
  const [demographicData, setDemographicData] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchDemographics = async () => {
      setLoading(true);

      try {
        // 1. Instructor verisini al
        const instRef = doc(db, "instructors", user.uid);
        const instSnap = await getDoc(instRef);
        if (!instSnap.exists()) {
          console.error("Instructor not found");
          setLoading(false);
          return;
        }

        const instructor = instSnap.data();
        const instructorName = instructor.name.toLowerCase();
        const allCourses = [...(instructor.currentcourses || []), ...(instructor.pastcourses || [])];

        // 2. Tüm courses koleksiyonundaki dersleri al
        const coursesCol = collection(db, "courses");
        const coursesSnap = await getDocs(coursesCol);
        const allCourseDocs = coursesSnap.docs.map(doc => doc.data());

        // 3. Instructor'ın verdiği dersleri bul ve grupla
        const relevantCourses = allCourseDocs.filter(course => {
          if (!course.course_code || !course.instructor) return false;
          return (
            allCourses.includes(course.course_code) &&
            course.instructor.toLowerCase().includes(instructorName)
          );
        });

        // 4. course_code'a göre grupla
        const groupedByCourse = {};
        relevantCourses.forEach(course => {
          const code = course.course_code;
          if (!groupedByCourse[code]) groupedByCourse[code] = [];
          groupedByCourse[code].push(course);
        });

        // 5. Her ders için özet veriler hazırla
        const summaries = Object.entries(groupedByCourse).map(([courseCode, versions]) => {
          const totalSections = versions.length;
          const totalStudents = versions.reduce((sum, v) => sum + (v.total_enrolled || 0), 0);
          const avgGPA =
            versions.reduce((sum, v) => sum + (v.section_gpa || 0), 0) / totalSections;

          // zaman sırasına göre sıralayalım (önceki analizler için)
          const timeline = versions
            .map(v => ({
              semester: v.semester,
              gpa: v.section_gpa,
              enrolled: v.total_enrolled,
              year: v.year_start,
            }))
            .sort((a, b) => (a.semester > b.semester ? 1 : -1));

          return {
            courseCode,
            totalSections,
            totalStudents,
            avgGPA: avgGPA.toFixed(2),
            timeline,
          };
        });

        setDemographicData(summaries);
      } catch (err) {
        console.error("Error fetching demographics:", err);
      }

      setLoading(false);
    };

    fetchDemographics();
  }, [user]);

  if (loading) return <div>Loading demographics...</div>;

  if (demographicData.length === 0)
    return <div>No demographic data available for this instructor.</div>;

  return (
    <div className="p-4 space-y-4  max-h-[600px] animate-fade-in overflow-y-scroll scrollbar-hide">
      <h2 className="text-2xl font-bold mb-4">Instructor Demographics</h2>

      {demographicData.map((course, idx) => (
        <div key={idx} className="bg-gray-500 rounded-lg shadow p-4 border">
          <h3 className="text-xl font-semibold mb-2">{course.courseCode}</h3>
          <p>Total Sections: {course.totalSections}</p>
          <p>Total Students: {course.totalStudents}</p>
          <p>Average GPA: {course.avgGPA}</p>

          <div className="mt-2">
            <h4 className="font-semibold">Timeline:</h4>
            <ul className="text-sm list-disc list-inside">
              {course.timeline.map((entry, i) => (
                <li key={i}>
                  {entry.semester} ({entry.year}): GPA {entry.gpa}, Students: {entry.enrolled}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
