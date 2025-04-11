    document.addEventListener("DOMContentLoaded", function () {
        const calendarContainer = document.getElementById("calendar-container");
        const yearSelect = document.getElementById("yearSelect");
        const toggleModeBtn = document.getElementById("toggleMode");
        let holidaysByYear = {};
        let currentMode = "year";

        const params = new URLSearchParams(window.location.search);
        let selectedYear = parseInt(params.get("year")) || new Date().getFullYear();

        for (let i = 2020; i <= 2025; i++) {
            let option = document.createElement("option");
            option.value = i;
            option.textContent = i;
            yearSelect.appendChild(option);
        }

        yearSelect.value = selectedYear;
        fetchHolidays().then(() => generateYearCalendar(selectedYear));

        yearSelect.addEventListener("change", function () {
            const newYear = parseInt(this.value);
            if (currentMode === "year") {
                window.history.pushState({}, "", `tahunan.html?year=${newYear}`);
                fetchHolidays(newYear);
            } else {
                window.location.href = `bulan.html?year=${newYear}&month=1`;
            }
        });

        toggleModeBtn.addEventListener("click", function () {
            if (currentMode === "year") {
                currentMode = "month";
                toggleModeBtn.textContent = "Mode Tahunan";
                window.location.href = `bulan.html?year=${yearSelect.value}&month=1`;
            } else {
                currentMode = "year";
                toggleModeBtn.textContent = "Mode Bulanan";
                generateYearCalendar(yearSelect.value);
            }
        });

        async function fetchHolidays(year) {
            try {
                let apiData = [];
                try {
                    const apiResponse = await fetch(`https://api-harilibur.vercel.app/api?year=${year}`);
                    apiData = await apiResponse.json();
                    if (!Array.isArray(apiData)) apiData = [];
                } catch (apiErr) {
                    console.warn("Gagal fetch dari API, lanjut pakai data lokal.");
                }
        
                const localResponse = await fetch("holiday.JSON");
                const localData = await localResponse.json();
        
                const combined = [
                    ...apiData,
                    ...(Array.isArray(localData?.holiday) ? localData.holiday.filter(h => h.holiday_date.startsWith(`${year}-`)) : [])
                ];
        
                if (!holidaysByYear[year]) holidaysByYear[year] = {};
        
                combined.forEach(holiday => {
                    if (!holiday.holiday_date) return;
                    let [y, m, d] = holiday.holiday_date.split("-").map(n => parseInt(n, 10));
                    if (!holidaysByYear[y]) holidaysByYear[y] = {};
                    if (!holidaysByYear[y][m]) holidaysByYear[y][m] = {};
                    holidaysByYear[y][m][d] = holiday.holiday_name;
                });
        
                generateYearCalendar(year);
            } catch (err) {
                console.error(`Gagal memuat data libur ${year}:`, err);
            }
        }

        function generateYearCalendar(year) {
            calendarContainer.innerHTML = "";

            for (let month = 0; month < 12; month++) {
                let monthDiv = document.createElement("div");
                monthDiv.classList.add("month");
                monthDiv.setAttribute("data-month", month + 1);

                let monthName = new Date(year, month).toLocaleString("id-ID", { month: "long" });

                monthDiv.innerHTML = `
                    <h3>${monthName} ${year}</h3>
                    ${generateMonthTable(year, month)}
                `;

                monthDiv.addEventListener("click", function () {
                    window.location.href = `bulan.html?year=${year}&month=${month + 1}`;
                });

                calendarContainer.appendChild(monthDiv);
            }
        }

        function generateMonthTable(year, month) {
            let events = JSON.parse(localStorage.getItem("events") || "{}");
            let daysInMonth = new Date(year, month + 1, 0).getDate();
            let firstDay = new Date(year, month, 1).getDay();

            let table = "<table>";
            table += "<tr><th>M</th><th>S</th><th>S</th><th>R</th><th>K</th><th>J</th><th>S</th></tr>";
            table += "<tr>";

            for (let i = 0; i < firstDay; i++) {
                table += "<td></td>";
            }

            for (let day = 1; day <= daysInMonth; day++) {
                let holidayName = holidaysByYear[year]?.[month + 1]?.[day] || null;
                let holidayClass = holidayName ? "holiday" : "";
                let eventString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                let eventName = events[eventString];
                let eventClass = (eventName && eventName.length > 0) ? "eventday" : "";
                
                let currentDate = new Date(year, month, day);
                let dayOfWeek = currentDate.getDay();

                if (dayOfWeek === 0) {
                    holidayClass += " sunday";
                }

                if (dayOfWeek === 6) {
                    holidayClass += " saturday";
                }
            
                if ((firstDay + day - 1) % 7 === 0) table += "<tr>";
                table += `<td class="${holidayClass} ${eventClass}" title="${holidayName || ""}" data-date="${year}, ${month + 1}, ${day}">${day}</td>`;
                if ((firstDay + day) % 7 === 0) table += "</tr>";
            }

            table += "</tr></table>";
            return table;
        }
        fetchHolidays(selectedYear).then(() => generateYearCalendar(selectedYear));
    });