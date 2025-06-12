import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config.js";
import jsPDF from "jspdf";
import img from '../src/assets/download.png';

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
    { code: "F", label: "Fall" },
    { code: "S", label: "Spring" },
  ];

  const yearSuffix = (year) => {
    if (year === 1) return "First";
    if (year === 2) return "Second";
    if (year === 3) return "Third";
    return `Fourth`;
  };

  const generateCurriculumPDF = (courses) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const lineHeight = 18;
    let y = 60;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Curriculum Overview", pageWidth / 2, y, { align: "center" });
    y += 30;

    const drawTableHeader = (headers, yPos) => {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(220, 230, 241);
      const colX = [margin, margin + 200, margin + 320, margin + 420];
      doc.rect(margin - 2, yPos - lineHeight + 4, pageWidth - margin * 2 + 4, lineHeight + 4, "F");
      headers.forEach((header, i) => {
        doc.text(header, colX[i], yPos);
      });
      return yPos + lineHeight + 6;
    };

    const drawTableRow = (row, yPos, fill) => {
      const colX = [margin, margin + 200, margin + 320, margin + 420];
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (fill) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin - 2, yPos - lineHeight + 4, pageWidth - margin * 2 + 4, lineHeight, "F");
      }
      row.forEach((text, i) => {
        doc.text(text.toString(), colX[i], yPos);
      });
      return yPos + lineHeight;
    };

    for (const year of years) {
      const yearCourses = courses.filter((c) => c.year === year);
      for (const term of terms) {
        const termCourses = yearCourses
          .filter((c) => c.term === term.code)
          .sort((a, b) => a.course_code.localeCompare(b.course_code));

        if (termCourses.length === 0) continue;

        if (y > 700) {
          doc.addPage();
          y = 60;
        }

        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(`${yearSuffix(year)} Year - ${term.label} Term`, margin, y);
        y += lineHeight * 1.8;

        y = drawTableHeader(["Course Code", "Course Name", "ECTS", "Prerequisite"], y);

        let fill = false;
        for (const course of termCourses) {
          if (y > 750) {
            doc.addPage();
            y = 60;
          }
          y = drawTableRow(
            [
              course.course_code || "",
              course.course_name || "",
              course.credit?.toString() || "",
              course.prerequisite || "-",
            ],
            y,
            fill
          );
          fill = !fill;
        }

        y += lineHeight;
      }
    }

    doc.save("curriculum.pdf");
  };

  return (
    <div className="p-4">
      
      <div className="p-6 pb-40 h-[600px] overflow-y-scroll scrollbar-hide">
        {courses.length === 0 ? (
          <div className="text-gray-400 text-center mt-10 animate-pulse">
            Loading...
          </div>
        ) : (
          <div className="animate-fade-in">
            {years.map((year) => {
              const yearCourses = courses.filter((c) => c.year === year);
              return (
                <div key={year} className=" ">
                  <p className="text-4xl/5 font-medium text-gray-700">
                    {yearSuffix(year)} Year
                    <span className="  items-center align-middle opacity-20 ml-276 ">
        <button>
    <img onClick={()=>generateCurriculumPDF(courses)}
      src={img}
      alt="Download PDF"
      className=" h-12 w-12  "
    /> 
  </button>
      </span>
                  </p>

                  {terms.map((term) => {
                    const termCourses = yearCourses
                      .filter((c) => c.term === term.code)
                      .sort((a, b) =>
                        a.course_code.localeCompare(b.course_code)
                      );

                    if (termCourses.length === 0) return null;

                    return (
                      <div key={term.code} className="-mt-3 py-4">
                        <h4 className="text-md text-gray-700 mb-2 ml-1">
                          {term.label}
                        </h4>
                        <div className="rounded-2xl overflow-x-auto shadow-xl shadow-gray-700/10">
                          <table className="min-w-full rounded-2xl table-fixed font-light text-sm/5 text-gray-900">
                            <thead className="bg-gray-700 rounded-2xl text-md/5 text-gray-50">
                              <tr>
                                <th className="w-1/4 px-3 py-2 text-left font-light">
                                  Course Code
                                </th>
                                <th className="w-1/4 px-3 py-2 text-left font-light">
                                  Course Name
                                </th>
                                <th className="w-1/4 px-3 py-2 text-left font-light">
                                  ECTS
                                </th>
                                <th className="w-1/4 px-3 py-2 text-left font-light">
                                  Prerequisite
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {termCourses.map((course) => (
                                <tr key={course.course_code}>
                                  <td className="px-3 py-1.5 bg-gray-50/70">
                                    {course.course_code}
                                  </td>
                                  <td className="px-3 py-1.5 bg-gray-50/70">
                                    {course.course_name}
                                  </td>
                                  <td className="px-3 py-1.5 bg-gray-50/70">
                                    {course.credit}
                                  </td>
                                  <td className="px-3 py-1.5 bg-gray-50/70">
                                    {course.prerequisite || "-"}
                                  </td>
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
        )}
      </div>
    </div>
  );
}
