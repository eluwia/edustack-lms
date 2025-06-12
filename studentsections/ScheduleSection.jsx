import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/config.js";

const timeSlots = [
"08:30", "09:30", "10:30", "11:30", "12:30",
"13:30", "14:30", "15:30", "16:30"
];

const weekDays = ["M", "T", "W", "TH", "F"];
const fullDayNames = { M: "Monday", T: "Tuesday", W: "Wednesday", TH: "Thursday", F: "Friday" };

//color palette for courses
const palette = [
"#60697C",
"#94A3C0",
"#71C0BB",
"#94AEE3",
"#B5C7EB",
];

export default function ScheduleSection() {
const [courseSchedule, setCourseSchedule] = useState([]);
//user clicked on
const [currentSelection, setCurrentSelection] = useState(null);
//color for each course code
const [colorAssigns, setColorAssigns] = useState({});

const auth = getAuth();
const currentUser = auth.currentUser;

useEffect(() => {
if (!currentUser) return;


const fetchCourses = async () => {
  //get transcript
  const userDocRef = doc(db, "transcripts", currentUser.uid);
  const docSnapshot = await getDoc(userDocRef);
  if (docSnapshot.exists()) {
    const data = docSnapshot.data();
    //filter current semester spring 2024
    const springCourses = (data.courses || []).filter(course => {
      return course.year === 2024 && course.semester === "S" && course.schedule;
    });
    setCourseSchedule(springCourses);

    // assign course color
    const assignedColors = {};
    springCourses.forEach((course, idx) => {
      assignedColors[course.course_code] = palette[idx % palette.length];
    });
    setColorAssigns(assignedColors);
  } else {
    console.log("No transcript data found for this user");
  }
};


fetchCourses();
}, [currentUser]);

const convertTimeToMins = (timeStr) => {
//convert time and split 
const parts = timeStr.split(":").map(num => Number(num));
return parts[0] * 60 + parts[1];
};


const buildScheduleSlots = () => {
const slotMapping = {};
courseSchedule.forEach((course) => {
//split course schedule
const entries = course.schedule.split(",").map(entry => entry.trim());
entries.forEach(entry => {

for (let day of weekDays) {
if (entry.startsWith(day)) {
const timeRange = entry.slice(day.length);

const [startTime, endTime] = timeRange.split("-");
const startMinutes = convertTimeToMins(startTime);
const endMinutes = convertTimeToMins(endTime);

        for (let i = 0; i < timeSlots.length; i++) {
          const blockStart = convertTimeToMins(timeSlots[i]);
          const blockEnd = blockStart + 60; 
          if (startMinutes < blockEnd && endMinutes > blockStart) {
            const slotKey = day + "-" + timeSlots[i];
            slotMapping[slotKey] = { ...course };
          }
        }
      }
    }
  });
});
return slotMapping;
};

const scheduleSlots = buildScheduleSlots();

return (
<div className="animate-fade-in">
<div className="flex align-middle justify-center h-screen overflow-hidden">
<div className="w-2/3 mt-10 p-4 overflow-auto">

<h2 className="text-2xl font-light text-center text-gray-700 mb-4">
Weekly Schedule
</h2>

      <div
        className="grid rounded-xl shadow-md/10 bg-gray-50/60 backdrop-blur-3xl"
        style={{
          gridTemplateColumns: `100px repeat(${timeSlots.length}, 90px)`,
          gridTemplateRows: `40px repeat(${weekDays.length}, 40px)`
        }}
      >
        <div className="border-b border-r border-gray-300" />
        {timeSlots.map((slot) => (
          <div
            key={slot}
            className="text-center text-sm font-medium text-gray-600 border-b border-gray-300 flex items-center justify-center"
          >
            {slot}
          </div>
        ))}

        {weekDays.map((day) => (
          <React.Fragment key={day}>
            <div className="pl-4 flex items-center text-gray-600 text-sm border-r border-b border-gray-300">
              {fullDayNames[day]}
            </div>
            {timeSlots.map((slot) => {
              const cellKey = day + "-" + slot;
              const courseEntry = scheduleSlots[cellKey];
              return (
                <div
                  key={cellKey}
                  className="border-b border-gray-300 flex items-center justify-center text-sm cursor-pointer"
                  style={{
                    backgroundColor: courseEntry ? colorAssigns[courseEntry.course_code] : "transparent",
                    color: courseEntry ? "#F5F1FA" : "#000"
                  }}
                  onClick={() => {
                    if (courseEntry) {
                      setCurrentSelection(courseEntry);
                    }
                  }}
                >
                  {courseEntry ? courseEntry.course_code : ""}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>

    <div className="w-70 mt-22 p-4">
      <div className="h-60 p-4 bg-gray-50/60 backdrop-blur-3xl rounded-xl shadow-md/10">
        {currentSelection ? (
          <>
            <h3 className="text-2xl font-light text-gray-700 mb-2">
              {currentSelection.course_code}
            </h3>
            <p className="text-gray-600 mb-1">{currentSelection.course_name}</p>
            <p className="text-sm text-gray-500 mb-1">
              Credits: {currentSelection.credit || currentSelection.credits || "N/A"}
            </p>
            <p className="text-sm text-gray-500 mb-1">
              Grade: {currentSelection.letter || "N/A"} ({currentSelection.grade || "N/A"})
            </p>
            <p className="text-sm text-gray-500">
              Schedule: {currentSelection.schedule}
            </p>
          </>
        ) : (
          <p className="text-gray-400">Click a course to view details</p>
        )}
      </div>
    </div>
  </div>
</div>
);
}