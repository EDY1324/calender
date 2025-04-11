document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    let month = params.has("month") ? parseInt(params.get("month")) - 1 : new Date().getMonth();
    let year = params.has("year") ? parseInt(params.get("year")) : new Date().getFullYear();

    const monthTitle = document.getElementById("month-title");
    const calendarBody = document.getElementById("calendar-body");
    const prevMonthButton = document.getElementById("prev-month");
    const nextMonthButton = document.getElementById("next-month");
    const monthDropdown = document.getElementById("month-dropdown");
    const modeTahunanButton = document.getElementById("mode-tahunan");
    let holidaysByYear = {};

    const popup = document.getElementById("popup");
    const popupTitle = document.getElementById("popup-title");
    const eventList = document.getElementById("event-list");
    const eventText = document.getElementById("event-text");
    const saveEventBtn = document.getElementById("save-event");
    const closePopupBtn = document.getElementById("close-popup");

    let events = JSON.parse(localStorage.getItem("events")) || {};

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    function saveEventsToStorage() {
        localStorage.setItem("events", JSON.stringify(events));
    }

    function updateURL() {
        const newUrl = `bulan.html?month=${month + 1}&year=${year}`;
        window.history.pushState({}, "", newUrl);
        updateMonthTitle();
        
        if (!holidaysByYear[year]) {
            fetchHolidays(year).then(() => generateCalendar());
        } else {
            generateCalendar();
        }
    }

    function updateMonthTitle() {
        monthTitle.textContent = `${monthNames[month]} ${year}`;
        monthDropdown.value = month;
    }

    function generateMonthDropdown() {
        monthDropdown.innerHTML = "";
        monthNames.forEach((name, index) => {
            let option = document.createElement("option");
            option.value = index;
            option.textContent = name;
            monthDropdown.appendChild(option);
        });
        monthDropdown.value = month;
    }

    monthDropdown.addEventListener("change", function () {
        month = parseInt(this.value);
        updateURL();
    });

    prevMonthButton.addEventListener("click", function () {
        month--;
        if (month < 0) {
            month = 11;
            year--;
        }
        updateURL();
    });

    nextMonthButton.addEventListener("click", function () {
        month++;
        if (month > 11) {
            month = 0;
            year++;
        }
        updateURL();
    });

    if (modeTahunanButton) {
        modeTahunanButton.addEventListener("click", function () {
            window.location.href = `tahunan.html?year=${year}`;
        });
    }

    async function fetchHolidays(year) {
        try {
            let response = await fetch(`https://api-harilibur.vercel.app/api?year=${year}`);   
            let data = await response.json();
    
            if (!Array.isArray(data)) {
                console.error(`Gagal mendapatkan data libur untuk ${year}:`, data);
                return;
            }
    
            if (!holidaysByYear[year]) holidaysByYear[year] = {};
    
            data.forEach(holiday => {
                if (!holiday.holiday_date) return;
                let dateParts = holiday.holiday_date.split("-");
                let formattedDate = `${dateParts[1].padStart(2, "0")}-${dateParts[2].padStart(2, "0")}`;
                holidaysByYear[year][formattedDate] = holiday.holiday_name;
            });
    
            generateCalendar();
        } catch (error) {
            console.error(`Error mengambil data libur ${year}:`, error);
        }
    }
    fetchHolidays(year).then(() => { generateCalendar();
});

    function generateCalendar() {
        calendarBody.innerHTML = "";
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let date = 1;
        for (let i = 0; i < 6; i++) {
            let row = document.createElement("tr");
            for (let j = 0; j < 7; j++) {
                let cell = document.createElement("td");
                if (i === 0 && j < firstDay) {
                    cell.textContent = "";
                } else if (date > daysInMonth) {
                    continue;
                } else {
                    let fullDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
                    cell.textContent = date;
                    cell.dataset.date = fullDate;
                    cell.addEventListener("click", function () {
                        openPopup(fullDate);
                    });

                    let currentDate = new Date(year, month, date);
                    if (currentDate.getDay() === 0) {
                        cell.style.color = "red";
                        cell.style.fontWeight = "bold";
                    }

                    if (currentDate.getDay() === 6) {
                        cell.style.color = "red";
                        cell.style.fontWeight = "bold";
                    }

                    if (!Array.isArray(events[fullDate])) {
                        events[fullDate] = [];
                    }

                    if (events[fullDate] && events[fullDate].length > 0) {
                        let eventContainer = document.createElement("div");
                        events[fullDate].forEach(event => {
                            let eventDiv = document.createElement("div");
                            eventDiv.textContent = event;
                            eventDiv.style.fontSize = "12px";
                            eventDiv.style.background = "#ffc107";
                            eventDiv.style.padding = "2px";
                            eventDiv.style.marginTop = "2px";
                            eventDiv.style.borderRadius = "4px";
                            eventContainer.appendChild(eventDiv);
                        });
                        cell.appendChild(eventContainer);
                    }

                    let formattedDate = `${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
                    if (holidaysByYear[year]?.[formattedDate]) {
                        cell.classList.add("holiday");

                        let holidayDiv = document.createElement("div");
                        holidayDiv.textContent = holidaysByYear[year][formattedDate];
                        holidayDiv.style.fontSize = "12px";
                        holidayDiv.style.color = "red";
                        holidayDiv.style.marginTop = "5px";

                        cell.appendChild(holidayDiv);
                    }

                    date++;
                }
                row.appendChild(cell);
            }
            calendarBody.appendChild(row);
        }
    }

    function openPopup(date) {
        popup.classList.remove("hidden");
        popupTitle.textContent = `Jadwal untuk ${date}`;
        eventList.innerHTML = "";
        
        if (events[date] && events[date].length > 0) {
            events[date].forEach((event, index) => {
                let li = document.createElement("li");
                li.textContent = event;
                let deleteBtn = document.createElement("button");
                deleteBtn.className = "delete"
                deleteBtn.textContent = "Hapus";
                deleteBtn.onclick = function () {
                    events[date].splice(index, 1);
                    if (events[date].length === 0) delete events[date];
                    saveEventsToStorage();
                    generateCalendar();
                    openPopup(date);
                };
                li.appendChild(deleteBtn);
                eventList.appendChild(li);
            });
        }

        saveEventBtn.onclick = function () {
            let newEvent = eventText.value.trim();
            if (newEvent) {
                if (!events[date]) events[date] = [];
                events[date].push(newEvent);
                saveEventsToStorage();
                generateCalendar();
                openPopup(date);
            }
            eventText.value = "";
        };

        closePopupBtn.onclick = closePopup;
    }   

    function closePopup() {
        popup.classList.add("hidden");
    }

    generateMonthDropdown();
    updateMonthTitle();
    generateCalendar();
});