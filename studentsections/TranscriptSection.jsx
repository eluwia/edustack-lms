import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/config.js";
import jsPDF from "jspdf";

export default function TranscriptSection() {
  const [student, setStudent] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  const calculateCompletedCredits = (allCourses) => {
    const courseMap = new Map();
    allCourses.forEach((course) => {
      const { course_code, year, semester, credit, letter } = course;
      const isPassed = letter && letter !== "F";
      const termValue = `${year}${semester}`;
      if (!isPassed) return;
      if (
        !courseMap.has(course_code) ||
        courseMap.get(course_code).termValue < termValue
      ) {
        courseMap.set(course_code, {
          termValue,
          credit: credit || 0,
        });
      }
    });
    let total = 0;
    for (const { credit } of courseMap.values()) {
      total += credit;
    }
    return total;
  };

  const calculateAttemptedCredits = (allCourses) => {
    const courseMap = new Map();
    allCourses.forEach((course) => {
      const { course_code, year, semester, credit } = course;
      const termValue = `${year}${semester}`;
      if (
        !courseMap.has(course_code) ||
        courseMap.get(course_code).termValue < termValue
      ) {
        courseMap.set(course_code, {
          termValue,
          credit: credit || 0,
        });
      }
    });
    let total = 0;
    for (const { credit } of courseMap.values()) {
      total += credit;
    }
    return total;
  };

const generateTranscriptPDF = () => {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const lineHeight = 18;
  let y = 60;

  // Başlık
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Student Transcript", pageWidth / 2, y, { align: "center" });

  y += 30;

  // Öğrenci bilgileri
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const studentName = student?.fullname || "";
  const cleanName = studentName.replace(/ı/g, "i"); // türkçe i küçük ı sorununu basitçe giderelim

  doc.text(`Student Name: ${cleanName}`, margin, y);
  doc.text(`Student Number: ${student?.studentno || ""}`, pageWidth / 2 + margin / 2, y);
  y += lineHeight;
  doc.text(`University Email: ${student?.email || ""}`, margin, y);
  doc.text(`Program: ${student?.program || ""}`, pageWidth / 2 + margin / 2, y);
  y += lineHeight;
  doc.text(`Faculty: ${student?.department || ""}`, margin, y);
  doc.text(`Credits Completed: ${student?.creditscompleted || "0"}`, pageWidth / 2 + margin / 2, y);
  y += lineHeight;
  const lastGPA = cumulativeGPAs[sortedKeys[sortedKeys.length - 1]] || "0.00";
  doc.text(`Overall GPA: ${lastGPA}`, margin, y);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2 + margin / 2, y);

  y += lineHeight * 2;

  // Fonksiyon: Başlık satırı ve tablo çizgisi olmadan, başlığı arka planla renklendir
  const drawTableHeader = (headers, yPos) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(220, 230, 241); // açık mavi arka plan
    const headerHeight = lineHeight + 4;
    const colX = [margin, margin + 70, margin + 300, margin + 370, margin + 440];

    doc.rect(margin - 2, yPos - lineHeight + 4, pageWidth - margin * 2 + 4, headerHeight, "F");

    headers.forEach((header, i) => {
      doc.text(header, colX[i], yPos);
    });

    return yPos + headerHeight + 4; // biraz boşluk da veriyoruz
  };

  // Fonksiyon: Satır yazma
  const drawTableRow = (row, yPos) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const colX = [margin, margin + 70, margin + 300, margin + 370, margin + 440];
    row.forEach((text, i) => {
      doc.text(text.toString(), colX[i], yPos);
    });
    return yPos + lineHeight;
  };

  // Her dönem için tablo oluştur
  const headers = ["Course Code", "Course Name", "ECTS", "Letter Grade"];
  coursesByYearTermSorted.forEach(([key, courses]) => {
    const [year, term] = key.split("-");
    const termName = terms[term];
    const yearName = yearLabel(Number(year));
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(`${yearName} Year - ${termName} Term`, margin, y);

    y += lineHeight * 1.8;

    y = drawTableHeader(headers, y);

    let fillRow = false;
    courses.forEach((course) => {
      if (y > 750) {
        doc.addPage();
        y = 60;
      }
      // Alternatif satır rengi
      if (fillRow) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin - 2, y - lineHeight + 4, pageWidth - margin * 2 + 4, lineHeight, "F");
      }
      fillRow = !fillRow;

      y = drawTableRow(
        [
          course.course_code,
          course.course_name,
          course.credit || "",
          course.letter || "-",
        ],
        y
      );
    });

    // Term özet bilgileri
    const termAttemptedCredits = courses.reduce((acc, c) => acc + (c.credit || 0), 0);
    const termCompletedCredits = courses.reduce(
      (acc, c) => (c.letter && c.letter !== "F" ? acc + (c.credit || 0) : acc),
      0
    );
    const termSPA = calculateTermGPA(courses).toFixed(2);
    const termGPA = cumulativeGPAs[key] || "0.00";

    y += lineHeight / 2;
    doc.setFont("helvetica", "bold");
    doc.text(`Attempted Credits: ${termAttemptedCredits}`, margin, y);
    doc.text(`Completed Credits: ${termCompletedCredits}`, margin + 180, y);
    doc.text(`SPA: ${termSPA}`, margin + 360, y);
    doc.text(`GPA: ${termGPA}`, margin + 460, y);

    y += lineHeight * 2;

    if (y > 750) {
      doc.addPage();
      y = 60;
    }
  });

  doc.save("transcript.pdf");
};



  const calculateTermGPA = (courses) => {
    let totalCredits = 0;
    let totalPoints = 0;
    courses.forEach((c) => {
      const credit = c.credit || 0;
      const grade = c.grade || 0;
      totalCredits += credit;
      totalPoints += (grade / 25) * credit;
    });
    return totalCredits ? totalPoints / totalCredits : 0;
  };

  const calculateCumulativeGPAs = (coursesByYearTermSorted) => {
    let totalCredits = 0;
    let totalPoints = 0;
    const cumulativeGPAs = {};

    for (const [key, courses] of coursesByYearTermSorted) {
      const termSPA = calculateTermGPA(courses);
      if (termSPA === 0) {
        cumulativeGPAs[key] = totalCredits ? (totalPoints / totalCredits).toFixed(2) : "0.00";
        continue;
      }
      const termCredits = courses.reduce((acc, c) => acc + (c.credit || 0), 0);
      totalCredits += termCredits;
      totalPoints += termSPA * termCredits;
      const cumulativeGPA = totalCredits ? totalPoints / totalCredits : 0;
      cumulativeGPAs[key] = cumulativeGPA.toFixed(2);
    }
    return cumulativeGPAs;
  };

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "student"), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setError("Student not found");
          setLoading(false);
          return;
        }
        const studentDoc = snapshot.docs[0];
        const studentData = studentDoc.data();
        setStudent(studentData);

        const transcriptRef = doc(db, "transcripts", user.uid);
        const transcriptSnap = await getDoc(transcriptRef);
        if (!transcriptSnap.exists()) {
          setError("Transcript not found");
          setLoading(false);
          return;
        }
        const transcriptData = transcriptSnap.data();
        setTranscript(transcriptData);
        setError(null);

        const completedCredits = calculateCompletedCredits(transcriptData.courses);
        if (studentData.creditscompleted !== completedCredits) {
          await updateDoc(doc(db, "student", studentDoc.id), {
            creditscompleted: completedCredits,
          });
          setStudent((prev) => ({ ...prev, creditscompleted: completedCredits }));
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[600px] text-gray-400 text-lg animate-pulse">
        Loading...
      </div>
    );
  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;

  const coursesByYearTerm = {};
  transcript?.courses?.forEach((c) => {
    const key = `${c.year}-${c.semester}`;
    if (!coursesByYearTerm[key]) coursesByYearTerm[key] = [];
    coursesByYearTerm[key].push(c);
  });
  const sortedKeys = Object.keys(coursesByYearTerm).sort();
  const coursesByYearTermSorted = sortedKeys.map((key) => [key, coursesByYearTerm[key]]);
  const cumulativeGPAs = calculateCumulativeGPAs(coursesByYearTermSorted);

  const yearLabel = (year) => {
    if (year === 1) return "First";
    if (year === 2) return "Second";
    if (year === 3) return "Third";
    if (year === 4) return "Fourth";
    return year;
  };

  const terms = { F: "Fall", S: "Spring", M: "Summer" };

  return (
    <div className="p-6 max-h-[600px] overflow-y-scroll scrollbar-hide animate-fade-in font-sans">
      {/* Öğrenci Bilgileri */}
      <div className="mb-6 text-gray-700 overflow-hidden rounded-2xl border shadow-md shadow-gray-300/80 backdrop-blur-3xl border-gray-300 bg-gray-100">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="border-b border-r border-gray-300 px-4 py-2 font-medium">Student Name:</td>
              <td className="border-b border-r border-gray-300 px-4 py-2">{student?.fullname}</td>
              <td className="border-b border-r border-gray-300 px-4 py-2 font-medium">Student Number:</td>
              <td className="border-b border-gray-300 px-4 py-2">{student?.studentno}</td>
            </tr>
            <tr>
              <td className="border-b border-r border-gray-300 px-4 py-2 font-medium">University Email:</td>
              <td className="border-b border-r border-gray-300 px-4 py-2">{student?.email}</td>
              <td className="border-b border-r border-gray-300 px-4 py-2 font-medium">Program:</td>
              <td className="border-b border-gray-300 px-4 py-2">{student?.program}</td>
            </tr>
            <tr>
              <td className="border-b border-r border-gray-300 px-4 py-2 font-medium">Faculty:</td>
              <td className="border-b border-r border-gray-300 px-4 py-2">{student?.department}</td>
              <td className="border-b border-r border-gray-300 px-4 py-2 font-medium">Credits Completed:</td>
              <td className="border-b border-gray-300 px-4 py-2">{student?.creditscompleted}</td>
            </tr>
            <tr>
              <td className="border-r border-gray-300 px-4 py-2 font-medium">Overall GPA:</td>
              <td className="border-r border-gray-300 px-4 py-2">
                {cumulativeGPAs[sortedKeys[sortedKeys.length - 1]] || "0.00"}
              </td>
              <td className="border-r border-gray-300 px-4 py-2 font-medium">Transcript Date:</td>
              <td className="px-4 py-2">{new Date().toLocaleDateString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Dersler ve Dönem Özeti */}
      {coursesByYearTermSorted.map(([key, courses]) => {
        const [year, term] = key.split("-");
        const sortedCourses = courses.sort((a, b) =>
          a.course_code.localeCompare(b.course_code)
        );

        const termAttemptedCredits = courses.reduce((acc, c) => acc + (c.credit || 0), 0);
        const termCompletedCredits = courses.reduce(
          (acc, c) => (c.letter && c.letter !== "F" ? acc + (c.credit || 0) : acc),
          0
        );
        const termSPA = calculateTermGPA(courses).toFixed(2);
        const termGPA = cumulativeGPAs[key] || "0.00";

        return (
          <div key={key} className="mb-10">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">
              {yearLabel(Number(year))} {terms[term]}
            </h2>
            <div className="rounded-xl shadow-lg overflow-x-auto">
              <table className="w-full table-fixed text-left text-gray-900 text-sm">
                <thead className="bg-gray-700 text-white">
                  <tr>
                    <th className="px-4 py-2 w-1/4">Course Code</th>
                    <th className="px-4 py-2 w-1/2">Course Name</th>
                    <th className="px-4 py-2 w-1/4">ECTS</th>
                    <th className="px-4 py-2 w-1/4">Letter Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCourses.map((course) => (
                    <tr key={course.course_code} className="odd:bg-gray-100">
                      <td className="px-4 py-2">{course.course_code}</td>
                      <td className="px-4 py-2">{course.course_name}</td>
                      <td className="px-4 py-2">{course.credit}</td>
                      <td className="px-4 py-2">{course.letter}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-700 text-white">
                  <tr>
                    <td className="px-4 py-2 font-medium">Attempted Credits: {termAttemptedCredits}</td>
                    <td className="px-4 py-2 font-medium">Completed Credits: {termCompletedCredits}</td>
                    <td className="px-4 py-2 font-medium">SPA: {termSPA}</td>
                    <td className="px-4 py-2 font-medium">GPA: {termGPA}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}
      <div>
      
      <button
        onClick={generateTranscriptPDF}
        className=" flex align-middle ml-307 mt-4 px-4 py-2 bg-gray-700 text-white rounded  hover:bg-gray-500"
      >
        
        Download PDF
      </button>
      
      </div>

      {/* Printable PDF Hidden Div */}
      <div id="printable-transcript" className="hidden">
        <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Year</th>
              <th>Semester</th>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>ECTS</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {coursesByYearTermSorted.map(([key, courses]) => {
              const [year, term] = key.split("-");
              return courses.map((course, idx) => (
                <tr key={`${key}-${idx}`}>
                  <td>{year}</td>
                  <td>{term}</td>
                  <td>{course.course_code}</td>
                  <td>{course.course_name}</td>
                  <td>{course.credit}</td>
                  <td>{course.letter || "-"}</td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
