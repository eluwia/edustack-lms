import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config.js";

export default function CurriculumSection() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const snapshot = await getDocs(collection(db, "curriculumandelectives"));
      const data = snapshot.docs.map((doc) => doc.data());
      setCourses(data);
    };
    fetchCourses();
  }, []);

  const years = [1, 2, 3, 4];
  const terms = [
    { code: "F", label: "Fall Semester" },
    { code: "S", label: "Spring Semester" },
  ];

  const yearSuffix = (year) => {
    if (year === 1) return "First";
    if (year === 2) return "Second";
    if (year === 3) return "Third";
    return `Fourth`;
  };

  return (
    <div className="p-4">
      <div className="p-6 pb-40 h-[600px] overflow-y-scroll scrollbar-hide">

        {years.map((year) => {
          const yearCourses = courses.filter((c) => c.year === year);
          return (
            <div key={year} className="">
              <p className="text-5xl font-normal text-gray-700/50">
                {yearSuffix(year)} Year
              </p>

              {terms.map((term) => {
                const termCourses = yearCourses
                  .filter((c) => c.term === term.code)
                  .sort((a, b) => a.course_code.localeCompare(b.course_code));

                if (termCourses.length === 0) return null;

                return (
                  <div key={term.code} className=" -mt-3 py-4 ">
                    <h4 className="text-xl text-gray-800/50 mb-2 ">{term.label}</h4>
                    <div className=" rounded-2xl overflow-x-auto">
                      <table className="min-w-full rounded-2xl table-fixed text-sm text-gray-900">


                        <thead className="bg-gray-200 rounded-2xl text-gray-700 font-medium">
                          <tr>
                            <th className="w-1/4 px-3 py-2 text-left ">Course Code</th>
<th className="w-1/4 px-3 py-2 text-left">Course Name</th>
<th className="w-1/4 px-3 py-2 text-left">ECTS</th>
<th className="w-1/4 px-3 py-2 text-left">Prerequisite</th>
                          </tr>
                        </thead>
                        <tbody>
                          {termCourses.map((course) => (
                            <tr key={course.course_code} className="">
                              <td className=" px-3 py-1.5">{course.course_code}</td>
                              <td className="px-3 py-1.5">{course.course_name}</td>
                              <td className="px-3 py-1.5">{course.credit}</td>
                              <td className="px-3 py-1.5">{course.prerequisite || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
