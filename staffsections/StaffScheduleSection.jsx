import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/config";

const timeSlots = [
  "08:30", "09:30", "10:30", "11:30", "12:30",
  "13:30", "14:30", "15:30", "16:30"
];
const weekDays = ["TH", "M", "T", "W", "F"];
const fullDayNames = { M: "Monday", T: "Tuesday", W: "Wednesday", TH: "Thursday", F: "Friday" };
const palette = ["#60697C", "#94A3C0", "#71C0BB", "#94AEE3", "#B5C7EB"];

export default function StaffScheduleSection() {
  const [scheduleData, setScheduleData] = useState({});
  const [colorAssigns, setColorAssigns] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  const convertTimeToMins = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  useEffect(() => {
    if (!user) return;

    const fetchSchedule = async () => {
      try {
        const instRef = doc(db, "instructors", user.uid);
        const instSnap = await getDoc(instRef);
        if (!instSnap.exists()) {
          console.log("No instructor data found.");
          return;
        }

        const instData = instSnap.data();
        const currentCourses = instData.currentcourses || [];

        if (currentCourses.length === 0) {
          console.log("Instructor has no current courses.");
          return;
        }

        const scheduleRef = doc(db, "courseschedules", user.uid);
        const scheduleSnap = await getDoc(scheduleRef);

        if (!scheduleSnap.exists()) {
          console.log("No schedule document found for uid:", user.uid);
          return;
        }

        const schedule = scheduleSnap.data();

        const mapped = {};
        const assignedColors = {};
        let colorIndex = 0;

        currentCourses.forEach(courseCode => {
          const courseSections = schedule[courseCode];

          if (!courseSections || !Array.isArray(courseSections)) {
            console.log(`No schedule found for course: ${courseCode}`);
            return;
          }

          if (!assignedColors[courseCode]) {
            assignedColors[courseCode] = palette[colorIndex % palette.length];
            colorIndex++;
          }

          courseSections.forEach(sectionObj => {
            ["lecture", "lab"].forEach(type => {
              if (sectionObj[type]) {
                const entries = sectionObj[type].split(",").map(s => s.trim());
                entries.forEach(entry => {
                  for (let day of weekDays) {
                    if (entry.startsWith(day)) {
                      const timeRange = entry.slice(day.length);
                      const [startTime, endTime] = timeRange.split("-");
                      const startMinutes = convertTimeToMins(startTime);
                      const endMinutes = convertTimeToMins(endTime);

                      timeSlots.forEach(slot => {
                        const blockStart = convertTimeToMins(slot);
                        const blockEnd = blockStart + 60;

                        if (startMinutes < blockEnd && endMinutes > blockStart) {
                          const slotKey = day + "-" + slot;
                          mapped[slotKey] = {
                            courseCode,
                            type,
                            section: sectionObj.section,
                            time: entry
                          };
                        }
                      });
                    }
                  }
                });
              }
            });
          });
        });

        setScheduleData(mapped);
        setColorAssigns(assignedColors);

      } catch (err) {
        console.error("Error fetching schedule:", err);
      }
    };

    fetchSchedule();
  }, [user]);

  return (
    <div className="animate-fade-in">
      <div className="flex align-middle justify-center h-screen overflow-hidden">
        <div className="w-2/3 mt-10 p-4 overflow-auto">
          <h2 className="text-2xl font-light text-center text-gray-700 mb-4">
            Instructor Weekly Schedule
          </h2>

          <div
            className="grid rounded-xl shadow-md/10 bg-gray-50/60 backdrop-blur-3xl"
            style={{
              gridTemplateColumns: `100px repeat(${timeSlots.length}, 90px)`,
              gridTemplateRows: `40px repeat(${weekDays.length}, 40px)`
            }}
          >
            <div className="border-b border-r border-gray-300" />
            {timeSlots.map(slot => (
              <div
                key={slot}
                className="text-center text-sm font-medium text-gray-600 border-b border-gray-300 flex items-center justify-center"
              >
                {slot}
              </div>
            ))}

            {weekDays.map(day => (
              <React.Fragment key={day}>
                <div className="pl-4 flex items-center text-gray-600 text-sm border-r border-b border-gray-300">
                  {fullDayNames[day]}
                </div>
                {timeSlots.map(slot => {
                  const key = day + "-" + slot;
                  const data = scheduleData[key];
                  return (
                    <div
                      key={key}
                      className="border-b border-gray-300 flex items-center justify-center text-sm cursor-pointer"
                      style={{
                        backgroundColor: data ? colorAssigns[data.courseCode] : "transparent",
                        color: data ? "#F5F1FA" : "#000"
                      }}
                      onClick={() => data && setSelectedCourse(data)}
                    >
                      {data ? `${data.courseCode} (${data.type[0].toUpperCase()})` : ""}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="w-70 mt-22 p-4">
          <div className="h-60 p-4 bg-gray-50/60 backdrop-blur-3xl rounded-xl shadow-md/10">
            {selectedCourse ? (
              <>
                <h3 className="text-2xl font-light text-gray-700 mb-2">
                  {selectedCourse.courseCode}
                </h3>
                <p className="text-gray-600 mb-1">Section: {selectedCourse.section}</p>
                <p className="text-sm text-gray-500 mb-1">
                  Type: {selectedCourse.type}
                </p>
                <p className="text-sm text-gray-500">
                  Time: {selectedCourse.time}
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
