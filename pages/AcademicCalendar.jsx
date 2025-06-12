import HandleLogout from "../components/HandleLogout";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../src/index.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const AcademicCalendar = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth()));
  const [events, setEvents] = useState({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = daysInMonth(year, month);

  const firstDay = new Date(year, month, 1).getDay();

  const nextMonth = () => setCurrentDate(new Date(year, month + 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1));

  const formatDate = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  useEffect(() => {
    const fetchEvents = async () => {
        const snapshot = await getDocs(collection(db, "calendarEvents"));
        const eventMap = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.date && data.type && data.title) {
            const eventDate = new Date(data.date.seconds * 1000); 
            const formattedDate = formatDate(eventDate.getDate());
            eventMap[formattedDate] = {
              type: data.type,
              title: data.title,
            };
          }
        });
        setEvents(eventMap);
      };
    fetchEvents();
  }, []);

  return (
    <div className="relative h-screen w-full flex items-center justify-center p-6 overflow-hidden">
      <div className="aurora-background"></div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="md:col-span-3 bg-white rounded-3xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <button onClick={prevMonth} className="text-cyan-700 hover:text-cyan-900 font-bold">←</button>
            <h2 className="text-2xl font-semibold text-gray-800">
              {currentDate.toLocaleString("default", { month: "long" })} {year}
            </h2>
            <button onClick={nextMonth} className="text-cyan-700 hover:text-cyan-900 font-bold">→</button>
          </div>

          <div className="grid grid-cols-7 text-center font-medium text-gray-500 mb-2">
            <div>M</div><div>T</div><div>W</div><div>Th</div><div>F</div><div>St</div><div>S</div>
          </div>

      
          <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-700 min-h-[20rem]">
            {Array.from({ length: 42 }).map((_, i) => {
              const dayNumber = i - (firstDay === 0 ? 6 : firstDay - 1) + 1;
              const isCurrentMonth = dayNumber >= 1 && dayNumber <= days;
              const dateKey = formatDate(dayNumber);
              const event = events[dateKey];
              const bgColor = event?.type === "holiday" ? "bg-red-200" :
                              event?.type === "course" ? "bg-yellow-200" :
                              "bg-gray-100";

              return (
                <div
                  key={i}
                  className={`p-2 rounded-lg ${isCurrentMonth ? bgColor : "bg-transparent"} ${isCurrentMonth ? "hover:bg-cyan-100" : ""} transition cursor-default`}
                  title={event?.title || ""}
                >
                  {isCurrentMonth ? dayNumber : ""}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Academic Calendar</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><span className="inline-block w-3 h-3 bg-red-300 rounded-full mr-2"></span>Holiday</li>
              <li><span className="inline-block w-3 h-3 bg-yellow-300 rounded-full mr-2"></span>Course</li>
            </ul>
          </div>
          <button onClick={() => navigate("/")} className="mt-6 bg-gray-700 text-white py-2 px-4 rounded-full hover:bg-gray-600 transition">
            Go back to the previous page
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcademicCalendar;
