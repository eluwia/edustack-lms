import React, { useState } from "react";

import "../src/index.css";
import HandleLogout from "../components/HandleLogout";
import CurriculumSection from "../studentsections/CurriculumSection";
import ProfileSection from "../studentsections/ProfileSection";

function StudentPage() {

  const [activeSection, setActiveSection] = useState("profile");

  const sections = [
    "profile",
    "schedule",
    "ccr",
    "transcript",
    "enrollment",
    "quota",
  ];

  const [fname, setFname] = useState("");
const [fullname, setFullname] = useState("");

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="aurora-background" />
      <div className="relative pt-8 w-full h-screen flex justify-center items-start">
        <div className="bg-white/90 w-[95vw] max-w-[95vw] h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">

          <div className="flex justify-between items-center px-8 py-4 bg-gray-200/50 shadow-md rounded-t-3xl sticky top-0 z-20">
            <div className="flex gap-4">
              {sections.map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`capitalize font-medium transition duration-300 hover:text-gray-600 ${activeSection === section ? "text-gray-700" : "text-gray-500"
                    }`}
                >
                  {section}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-700 font-medium">{fullname}</span>
              {<HandleLogout />}

            </div>
          </div>

          <div className="flex-1 relative">
            {activeSection === "profile" && (
  <ProfileSection setFullname={setFullname} setFname={setFname} />
)}

            {activeSection === "schedule" && (
              <div className="h-full w-full flex items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-800">Weekly Schedule</h1>
              </div>
            )}

            {activeSection === "ccr" && (
              <CurriculumSection/>
            )}

            {activeSection === "transcript" && (
              <div className="h-full w-full flex items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-800">Transcript Section</h1>
              </div>
            )}

            {activeSection === "enrollment" && (
              <div className="h-full w-full flex items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-800">Enrollment Section</h1>
              </div>
            )}

            {activeSection === "quota" && (
              <div className="h-full w-full flex items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-800">Quota Requests Section</h1>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
export default StudentPage;