import React, { useState, useEffect } from "react";

// Renk kodu fonksiyonu doluluk oranına göre
const getRiskColor = (ratio) => {
  if (ratio < 0.7) return "bg-green-200 text-green-800";
  if (ratio < 0.9) return "bg-yellow-200 text-yellow-800";
  return "bg-red-200 text-red-800";
};

const EnrollmentSection = () => {
  // Burada normalde Firestore'dan çekersin, şimdi örnek sabit veri:
  const [courses, setCourses] = useState([
    {
      course_code: "CS401",
      course_name: "Advanced Algorithms",
      sections: [
        { section: "A", instructor: "Dr. Lori", quota: 50, prediction: 48 },
        { section: "B", instructor: "Dr. Aynur", quota: 40, prediction: 25 },
      ],
    },
    {
      course_code: "CS402",
      course_name: "Distributed Systems",
      sections: [{ section: "A", instructor: "Dr. Lori", quota: 60, prediction: 55 }],
    },
  ]);

  const [selectedSections, setSelectedSections] = useState({});

  const toggleSection = (courseCode, section) => {
    const key = `${courseCode}-${section}`;
    setSelectedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="p-4 max-h-screen overflow-y-auto text-gray-700">
      <h2 className="text-2xl font-semibold mb-6">Ders Kayıt Tahminleri</h2>

      {courses.map(({ course_code, course_name, sections }) => (
        <div key={course_code} className="mb-6 border rounded-lg p-4 bg-white shadow">
          <h3 className="text-xl font-bold mb-3">
            {course_code} - {course_name}
          </h3>
          <div>
            {sections.map(({ section, instructor, quota, prediction }) => {
              const ratio = prediction / quota;
              const riskClass = getRiskColor(ratio);
              const remaining = quota - prediction;

              return (
                <div
                  key={section}
                  className="flex items-center justify-between p-3 mb-2 border rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleSection(course_code, section)}
                >
                  <div>
                    <p className="font-semibold">
                      Section {section} - {instructor}
                    </p>
                    <p className="text-sm text-gray-600">
                      Kontenjan: {quota} | Tahmini Kayıt: {prediction} | Kalan:{" "}
                      {remaining >= 0 ? remaining : 0}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded font-semibold ${riskClass}`}>
                    {(ratio * 100).toFixed(0)}%
                  </div>
                  <input
                    type="checkbox"
                    checked={!!selectedSections[`${course_code}-${section}`]}
                    onChange={() => toggleSection(course_code, section)}
                    onClick={(e) => e.stopPropagation()}
                    className="ml-4"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Seçilen Dersler ve Bölümler</h3>
        {Object.entries(selectedSections)
          .filter(([_, val]) => val)
          .map(([key]) => (
            <p key={key} className="text-gray-700">
              {key.replace("-", " - Section ")}
            </p>
          ))}
        {Object.values(selectedSections).every((v) => !v) && (
          <p className="text-gray-500">Henüz ders seçmediniz.</p>
        )}
      </div>
    </div>
  );
};

export default EnrollmentSection;
