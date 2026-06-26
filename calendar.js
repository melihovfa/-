// calendar.js
// Автоматический календарь официальных нерабочих праздничных дней РФ.
// Диапазон: 2023–2036, то есть 3 года до 2026 и 10 лет после 2026.
// Основа: ст. 112 ТК РФ. Для будущих лет производственные переносы могут уточняться Правительством РФ.

const CALENDAR_START_YEAR = 2023;
const CALENDAR_END_YEAR = 2036;

const holidayNames = {
  "01-01": "Новогодние каникулы",
  "01-02": "Новогодние каникулы",
  "01-03": "Новогодние каникулы",
  "01-04": "Новогодние каникулы",
  "01-05": "Новогодние каникулы",
  "01-06": "Новогодние каникулы",
  "01-07": "Рождество Христово",
  "01-08": "Новогодние каникулы",
  "02-23": "День защитника Отечества",
  "03-08": "Международный женский день",
  "05-01": "Праздник Весны и Труда",
  "05-09": "День Победы",
  "06-12": "День России",
  "11-04": "День народного единства"
};

function pad2(value) {
  return String(value).padStart(2, "0");
}

function makeDateString(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLocalDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function addDays(dateString, days) {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

function isWeekendDateString(dateString) {
  const day = parseLocalDate(dateString).getDay();
  return day === 0 || day === 6;
}

function getNextWorkingDay(dateString, occupiedDates) {
  let candidate = addDays(dateString, 1);

  while (isWeekendDateString(candidate) || occupiedDates.has(candidate)) {
    candidate = addDays(candidate, 1);
  }

  return candidate;
}

function generateOfficialHolidays(year) {
  const holidays = new Map();

  Object.entries(holidayNames).forEach(([monthDay, name]) => {
    const [month, day] = monthDay.split("-").map(Number);
    const dateString = makeDateString(year, month, day);
    holidays.set(dateString, name);
  });

  // Автоматически добавляем переносы для праздников, которые выпали на субботу/воскресенье.
  // Для будущих лет это ориентировочный расчёт: правительство может переносить часть выходных иначе.
  const originalDates = Array.from(holidays.keys());

  originalDates.forEach(dateString => {
    const monthDay = dateString.slice(5);

    // Январские переносы часто утверждаются отдельным постановлением,
    // поэтому сами 1–8 января уже исключаются, а дополнительные переносы лучше добавлять вручную при необходимости.
    if (monthDay.startsWith("01-")) return;

    if (isWeekendDateString(dateString)) {
      const transferDate = getNextWorkingDay(dateString, holidays);
      holidays.set(transferDate, `Перенос выходного дня: ${holidays.get(dateString)}`);
    }
  });

  return holidays;
}

function buildProductionCalendar() {
  const result = {};

  for (let year = CALENDAR_START_YEAR; year <= CALENDAR_END_YEAR; year++) {
    result[year] = Object.fromEntries(generateOfficialHolidays(year));
  }

  return result;
}

const productionCalendar = buildProductionCalendar();

function getAutomaticHolidaysBetweenYears(startDate, endDate) {
  let holidays = {};

  for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
    if (productionCalendar[year]) {
      holidays = { ...holidays, ...productionCalendar[year] };
    }
  }

  return holidays;
}
