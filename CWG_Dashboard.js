// =======================================
// CHARTS - PLAY WHE CHART
// Created By: CODEWITHGLASGOW or CWG
// Build: Widget/Full-Screen Play Whe Chart
// Version 6.2.0 - Year Navigation (Client-Side Per-Year Leaving/Meeting)
// Last Modified: September 22 2026
// =======================================

const BRANDING = "CODEWITHGLASGOW";
const BASE_API = "https://script.google.com/macros/s/AKfycbwyr-M_ZzIscNgxJmR_UYHgZqmamn62Np4msDFaCjX9KgyUmyjuzuIYbawBmT0_mw4j/exec?action=calendar&weeks=1200";

const TICKER_URL = "https://script.google.com/macros/s/AKfycbymSUZ3cuBP7wZSKkxs8QmjMkKP6q3j-LOW_CVpY3n6Sw1EzsdwPu6yTEkpOmiAJz95/exec?action=ticker";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const timeOrder = ["MOR", "MID", "NON", "EVE"];
const dayShort = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

let pwTimeline = [];
let timeline = [];

const todayName = daysOfWeek[new Date().getDay()];

function processTimelines(pwData) {
    pwTimeline = [];
    if (pwData && pwData.data && pwData.data.weeks) {
        pwData.data.weeks.forEach((wk) => {
            wk.days.forEach((day) => {
                timeOrder.forEach((t) => {
                    let val = String(day.draws[t]);
                    let m = val.match(/^(\d+)/);
                    if (m && val !== "PENDING" && val !== "-" && val !== "HOLIDAY") {
                        pwTimeline.push({ n: parseInt(m[1]), date: wk.startDate });
                    }
                });
            });
        });
    }
}

const CHART_1_16 = {
  1: [16, 29], 2: [17, 30], 3: [18, 31], 4: [19, 32],
  5: [20, 33], 6: [21, 34], 7: [22, 35], 8: [23, 36],
  9: [24, 1], 10: [25, 2], 11: [26, 3], 12: [27, 4],
  13: [28, 5], 14: [29, 6], 15: [30, 7], 16: [31, 8],
  17: [32, 9], 18: [33, 10], 19: [34, 11], 20: [35, 12],
  21: [36, 13], 22: [1, 14], 23: [2, 15], 24: [3, 16],
  25: [4, 17], 26: [5, 18], 27: [6, 19], 28: [7, 20],
  29: [8, 21], 30: [9, 22], 31: [10, 23], 32: [11, 24],
  33: [12, 25], 34: [13, 26], 35: [14, 27], 36: [15, 28]
};

const CHART_1_8 = {
  1: [8, 25], 2: [9, 26], 3: [10, 27], 4: [11, 28],
  5: [12, 29], 6: [13, 30], 7: [14, 31], 8: [15, 32],
  9: [16, 33], 10: [17, 34], 11: [18, 35], 12: [19, 36],
  13: [20, 1], 14: [21, 2], 15: [22, 3], 16: [23, 4],
  17: [24, 5], 18: [25, 6], 19: [26, 7], 20: [27, 8],
  21: [28, 9], 22: [29, 10], 23: [30, 11], 24: [31, 12],
  25: [32, 13], 26: [33, 14], 27: [34, 15], 28: [35, 16],
  29: [36, 17], 30: [1, 18], 31: [2, 19], 32: [3, 20],
  33: [4, 21], 34: [5, 22], 35: [6, 23], 36: [7, 24]
};

// =====================================
// YEAR HELPERS
// =====================================
function getAvailableYears(weeks) {
    if (!weeks || weeks.length === 0) return [];
    const years = new Set();
    const now = new Date();
    const currentYear = now.getFullYear();
    weeks.forEach(wk => {
        if (!wk.startDate) return;
        const parts = wk.startDate.split(" ");
        const year = parseInt(parts[2], 10);
        if (!isNaN(year) && year !== currentYear) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a).slice(0, 4);
}

function getYearFilteredWeeks(allWeeks, selectedYear) {
    if (!allWeeks || allWeeks.length === 0) return [];
    
    const now = new Date();
    const currentYear = now.getFullYear();
    
    if (selectedYear === "current" || selectedYear === currentYear) {
        const today = new Date();
        return allWeeks.filter(wk => {
            const wkDate = new Date(wk.startDate);
            return wkDate <= today || wk.isCurrentWeek;
        }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(-41);
    }
    
    return allWeeks.filter(wk => {
        if (!wk.startDate) return false;
        const parts = wk.startDate.split(" ");
        const year = parseInt(parts[2], 10);
        return year === selectedYear;
    }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

// ====================================
// LEAVING / MEETING — PER-YEAR CALC
// ====================================
function calculateLeavingMeeting(displayWeeks, isCurrentView) {
    const result = {
        leavingNumber: null, leavingSlot: null, leavingDate: null,
        meetingNumber: null, meetingSlot: null, meetingDate: null
    };
    
    if (!displayWeeks || displayWeeks.length === 0) return result;
    
    const sortedWeeks = [...displayWeeks].sort((a, b) => {
        const pa = a.startDate.split(" ");
        const pb = b.startDate.split(" ");
        return new Date(pa[2] + "-" + pa[1] + "-" + pa[0]) - new Date(pb[2] + "-" + pb[1] + "-" + pb[0]);
    });
    
    const currentWeek = sortedWeeks[sortedWeeks.length - 1];
    let previousWeek = null;
    for (let i = sortedWeeks.length - 2; i >= 0; i--) {
        const week = sortedWeeks[i];
        let hasValidDraw = false;
        if (week && week.days) {
            for (const day of week.days) {
                if (day && day.draws) {
                    for (const slot of timeOrder) {
                        const val = day.draws[slot];
                        if (val && val !== "-" && val !== "PENDING" && val !== "HOLIDAY") {
                            hasValidDraw = true; break;
                        }
                    }
                }
                if (hasValidDraw) break;
            }
        }
        if (hasValidDraw) { previousWeek = week; break; }
    }
    if (!previousWeek) previousWeek = currentWeek;
    
    function getDraw(week, dayName, slot) {
        if (!week) return null;
        const day = week.days.find(d => d.dayName === dayName);
        if (!day) return null;
        const val = day.draws[slot];
        return val && val !== "-" && val !== "PENDING" && val !== "HOLIDAY" ? parseInt(val, 10) : null;
    }
    
    function getDateForDraw(week, dayName) {
        if (!week || !week.startDate) return null;
        const parts = week.startDate.split(" ");
        const monthMap = {"Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,"Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11};
        const startDate = new Date(parts[2], monthMap[parts[1]], parseInt(parts[0]));
        const dayIndex = daysOfWeek.indexOf(dayName);
        if (dayIndex === -1) return null;
        const drawDate = new Date(startDate);
        drawDate.setDate(startDate.getDate() + dayIndex);
        return drawDate;
    }
    
    let leavingDayIdx = -1, leavingSlotIdx = -1;
    
    if (isCurrentView) {
        // For LIVE view: find the most recent draw based on today's weekday
        const now = new Date();
        const todayIdx = now.getDay();
        
        for (let d = todayIdx; d >= 0; d--) {
            for (let s = timeOrder.length - 1; s >= 0; s--) {
                const draw = getDraw(currentWeek, daysOfWeek[d], timeOrder[s]);
                if (draw) {
                    result.leavingNumber = draw;
                    leavingDayIdx = d;
                    leavingSlotIdx = s;
                    result.leavingSlot = timeOrder[s];
                    result.leavingDate = getDateForDraw(currentWeek, daysOfWeek[d]);
                    break;
                }
            }
            if (result.leavingNumber) break;
        }
        
        if (!result.leavingNumber) {
            for (let w = sortedWeeks.length - 2; w >= 0; w--) {
                const week = sortedWeeks[w];
                for (let d = daysOfWeek.length - 1; d >= 0; d--) {
                    for (let s = timeOrder.length - 1; s >= 0; s--) {
                        const draw = getDraw(week, daysOfWeek[d], timeOrder[s]);
                        if (draw) {
                            result.leavingNumber = draw;
                            leavingDayIdx = d;
                            leavingSlotIdx = s;
                            result.leavingSlot = timeOrder[s];
                            result.leavingDate = getDateForDraw(week, daysOfWeek[d]);
                            break;
                        }
                    }
                    if (result.leavingNumber) break;
                }
                if (result.leavingNumber) break;
            }
        }
    } else {
        // For historical year views: last draw of the year (last week, last day, last slot)
        for (let w = sortedWeeks.length - 1; w >= 0; w--) {
            const week = sortedWeeks[w];
            for (let d = daysOfWeek.length - 1; d >= 0; d--) {
                for (let s = timeOrder.length - 1; s >= 0; s--) {
                    const draw = getDraw(week, daysOfWeek[d], timeOrder[s]);
                    if (draw) {
                        result.leavingNumber = draw;
                        leavingDayIdx = d;
                        leavingSlotIdx = s;
                        result.leavingSlot = timeOrder[s];
                        result.leavingDate = getDateForDraw(week, daysOfWeek[d]);
                        break;
                    }
                }
                if (result.leavingNumber) break;
            }
            if (result.leavingNumber) break;
        }
    }
    
    // Meeting = the draw one slot after leaving (may fall on next day or wrap)
    if (leavingDayIdx !== -1 && leavingSlotIdx !== -1) {
        let nextDayIdx = leavingDayIdx;
        let nextSlotIdx = leavingSlotIdx + 1;
        if (nextSlotIdx >= timeOrder.length) { nextSlotIdx = 0; nextDayIdx = leavingDayIdx + 1; }
        if (nextDayIdx >= daysOfWeek.length) nextDayIdx = 0;
        
        const targetDay = daysOfWeek[nextDayIdx];
        const targetSlot = timeOrder[nextSlotIdx];
        
        // For historical: try to find in the NEXT week first (which may be next year)
        // If the leaving was the last draw of the year, meeting should come from the next available week
        if (!isCurrentView) {
            // Find the week right after the leaving week in allWeeks (not just displayWeeks)
            // Since we can't access allWeeks here, use the last week + search forward
            let meetingDraw = getDraw(currentWeek, targetDay, targetSlot);
            if (meetingDraw) {
                result.meetingNumber = meetingDraw;
                result.meetingSlot = targetSlot;
                result.meetingDate = getDateForDraw(currentWeek, targetDay);
            }
        } else {
            result.meetingNumber = getDraw(previousWeek, targetDay, targetSlot);
            if (result.meetingNumber) {
                result.meetingSlot = targetSlot;
                result.meetingDate = getDateForDraw(previousWeek, targetDay);
            }
            if (!result.meetingNumber) {
                for (let w = sortedWeeks.length - 2; w >= 0; w--) {
                    const week = sortedWeeks[w];
                    const draw = getDraw(week, targetDay, targetSlot);
                    if (draw) {
                        result.meetingNumber = draw;
                        result.meetingSlot = targetSlot;
                        result.meetingDate = getDateForDraw(week, targetDay);
                        break;
                    }
                }
            }
            if (!result.meetingNumber) {
                const draw = getDraw(currentWeek, targetDay, targetSlot);
                if (draw) {
                    result.meetingNumber = draw;
                    result.meetingSlot = targetSlot;
                    result.meetingDate = getDateForDraw(currentWeek, targetDay);
                }
            }
        }
    }
    
    return result;
}

// Check if running as widget
if (config.runsInWidget) {
    let widget = await createWidget();
    Script.setWidget(widget);
    Script.complete();
} else {
    await presentFullScreenCharts();
}

// =========================================
// WIDGET
// =========================================
async function createWidget() {
  let widget = new ListWidget();
  widget.url = URLScheme.forRunningScript() + "?show=true";
  
  let startColor = new Color("#020617");
  let endColor = new Color("#1e293b");
  let gradient = new LinearGradient();
  gradient.colors = [startColor, endColor];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  widget.setPadding(15, 18, 15, 18);

  let dc = new DrawContext();
  dc.size = new Size(980, 980);
  dc.opaque = false;
  dc.setTextColor(new Color("#ffffff", 0.08));
  dc.setFont(Font.boldSystemFont(120));
  dc.setTextAlignedCenter();
  dc.drawTextInRect("FSP SAGi", new Rect(0, 430, 980, 200));
  widget.backgroundImage = dc.getImage();

  let topBar = widget.addStack();
  topBar.addSpacer();
  let tag = topBar.addStack();
  tag.backgroundColor = new Color("#ff9d00");
  tag.cornerRadius = 8;
  tag.setPadding(3, 8, 3, 8);
  tag.url = "https://tt.wipayfinancial.com/scan2pay/MichaelGlasgow";
  let label = tag.addText("Support 🇹🇹 TTD $10");
  label.textColor = new Color("#000000");
  label.font = Font.boldSystemFont(12);

  let json = await new Request(TICKER_URL).loadJSON();
  let g = json.games;
  let updated = json.lastUpdated || "N/A";

  widget.addSpacer(5);
  let header = widget.addText(`Latest NLCB Results • ⏰ ${updated}`);
  header.font = Font.boldSystemFont(12.5);
  header.textColor = new Color("#888888");
  header.centerAlignText();
  widget.addSpacer(7);

  function addCircle(parent, text, bg, fg, size = 22) {
    let c = parent.addStack();
    c.layoutVertically();
    c.centerAlignContent();
    let ball = c.addStack();
    ball.backgroundColor = new Color(bg);
    ball.cornerRadius = size / 2;
    ball.size = new Size(size, size);
    ball.centerAlignContent();
    let t = ball.addText(text);
    t.font = Font.boldSystemFont(9);
    t.textColor = new Color(fg);
    return c;
  }

  const COL_W = 110;
  let grid = widget.addStack();
  grid.layoutVertically();
  grid.spacing = 12;

  function makeCol(parent) {
    let col = parent.addStack();
    col.layoutVertically();
    col.centerAlignContent();
    col.size = new Size(COL_W, 0);
    return col;
  }

  let r1 = grid.addStack();
  ["PLAY WHE", "PICK 2", "PICK 4"].forEach(txt => {
    let c = makeCol(r1);
    let t = c.addText(txt);
    t.font = Font.boldSystemFont(18);
    t.textColor = new Color("#ffa500");
    t.centerAlignText();
  });

  let r2 = grid.addStack();
  let pwCol = makeCol(r2);
  let p2Col = makeCol(r2);
  let p4Col = makeCol(r2);

  let pw = g.PLAYWHE[g.PLAYWHE.length-1];
  let pwNum = pw.numbers.match(/^\d+/)?.[0] || "";
  let mults = pw.numbers.match(/\(([^)]+)\)/)?.[1]?.split(", ") || [];
  let pws = pwCol.addStack(); pws.centerAlignContent();
  addCircle(pws, pwNum, "#ffff00", "#000000", 18);
  mults.forEach(m => {
    pws.addSpacer(2);
    let bg = m==="GB"?"#ffd700":m==="SB"?"#7c02b5":m==="JB"?"#0024f2":m==="SPB"?"#f29500":m==="PB"?"#9c8308":m=="BB"?"#ffa500":m==="WB"?"#ffffff":"#ff0000";
    let fg = (m==="WB"||m==="GB")?"#000000":"#ffffff";
    addCircle(pws, m, bg, fg, 18);
  });

  let p2 = g.PICK2[g.PICK2.length-1];
  let [pair, p2m = ""] = p2.numbers.trim().split(" ");
  let [n1, n2] = pair.split("/");
  let p2s = p2Col.addStack(); p2s.centerAlignContent();
  addCircle(p2s, n1, "#054517", "#ffff00", 22); p2s.addSpacer(2);
  addCircle(p2s, n2, "#ffff00", "#000000", 22);
  if(p2m) { p2s.addSpacer(2); addCircle(p2s, p2m, p2m==="WB"?"#ffffff":"#ff0000", p2m==="WB"?"#000000":"#ffffff", 22); }

  let p4 = g.PICK4[g.PICK4.length-1];
  let p4n = p4.numbers.match(/.{2}/g).map(n => String(parseInt(n,10)));
  let p4c = ["#ff0000","#ffff00","#00ff00","#ffffff"];
  let p4t = ["#ffffff","#000000","#000000","#000000"];
  let p4s = p4Col.addStack(); p4s.centerAlignContent();
  p4n.forEach((n,i) => { if(i>0) p4s.addSpacer(3); addCircle(p4s, n, p4c[i], p4t[i], 22); });

  let r3 = grid.addStack();
  [pw, p2, p4].forEach(item => {
    let c = makeCol(r3);
    let t = c.addText(`${item.name} • ${item.time}`);
    t.font = Font.mediumSystemFont(9);
    t.textColor = new Color("#888888");
    t.centerAlignText();
  });

  widget.addSpacer(11);
  let foot = widget.addText("CODEWITHGLASGOW • PlayWhe Chart • v6.Jul6");
  foot.font = Font.mediumSystemFont(12); foot.textColor = new Color("#555555"); foot.centerAlignText();

  widget.refreshAfterDate = new Date(Date.now() + 4 * 60 * 1000);
  return widget;
}

// =========================================
// FULL SCREEN PRESENTER
// =========================================
async function presentFullScreenCharts() {
    let params = args.queryParameters || {};
    let gameType = params.game || "P2WHE";
    
    try {
        const pwData = await new Request(BASE_API + "&game=P2WHE").loadJSON();
        const pwDataCopy = JSON.parse(JSON.stringify(pwData));
        
        processTimelines(pwDataCopy);
        
        let allWeeks = pwDataCopy?.data?.weeks || [];
        let title = "PLAY WHE";
        
        let html = generateFullScreenChart(allWeeks, gameType, title, pwDataCopy);
        
        let wv = new WebView();
        await wv.loadHTML(html);
        await wv.present();
        
    } catch (error) {
        let errorHtml = `<html><body style="padding:20px; font-family: sans-serif; color: red;">
            <h2>Error Loading Data</h2>
            <p>${error.message}</p>
        </body></html>`;
        let wv = new WebView();
        await wv.loadHTML(errorHtml);
        await wv.present();
    }
}

// ======================================
// SHELF CONTAINER
// ======================================
function renderShelfContainer(weeksData) {
    const shelfData = processShelfData(weeksData);
    return renderPlayWheShelfContainer(
        shelfData.marks,
        shelfData.numberColors,
        shelfData.intervals,
        shelfData.hotMarks,
        shelfData.overdueMarks
    );
}

// =====================================
// SHELF PROCESSING
// =====================================
function processShelfData(weeksData) {
    if (!weeksData || weeksData.length === 0) {
        return { marks: [], intervals: {}, numberColors: {}, hotMarks: [], overdueMarks: [] };
    }

    const dayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const timeOrd = ["MOR", "MID", "NON", "EVE"];
    const timeNames = { MOR: "Morning", MID: "Midday", NON: "Afternoon", EVE: "Evening" };
    
    const numberColors = {
        "01":"#ff6b6b","02":"#ffa94d","03":"#ffd43b","04":"#69db7c","05":"#38d9a9",
        "06":"#4dabf7","07":"#9775fa","08":"#f783ac","09":"#ff922b","10":"#fab005",
        "11":"#82c91e","12":"#20c997","13":"#339af0","14":"#845ef7","15":"#e599f7",
        "16":"#ff8787","17":"#ffc078","18":"#ffe066","19":"#8ce99a","20":"#63e6be",
        "21":"#74c0fc","22":"#b197fc","23":"#faa2c1","24":"#ffa8a8","25":"#ffec99",
        "26":"#c0eb75","27":"#96f2d7","28":"#a5d8ff","29":"#d0bfff","30":"#fcc2d7",
        "31":"#ff6b6b","32":"#ffa94d","33":"#ffd43b","34":"#69db7c","35":"#4dabf7",
        "36":"#9775fa"
    };

    const spirits = {
        1:"Centipede",2:"Old Lady",3:"Carriage",4:"Dead Man",5:"Parson Man",
        6:"Belly",7:"Hog",8:"Tiger",9:"Cattle",10:"Monkey",
        11:"Corbeau",12:"King",13:"Crapaud",14:"Money",15:"Sick Woman",
        16:"Jamette",17:"Pigeon",18:"Water Boat",19:"Horse",20:"Dog",
        21:"Mouth",22:"Rat",23:"House",24:"Queen",25:"Morrocoy",
        26:"Fowl",27:"Little Snake",28:"Red Fish",29:"Opium Man",30:"House Cat",
        31:"Parson Wife",32:"Shrimp",33:"Spider",34:"Blind Man",35:"Big Snake",
        36:"Donkey"
    };

    let intervals = {};
    for (let i = 1; i <= 36; i++) intervals[i] = 12;

    let markInfo = {};
    let lastSeenTime = {};
    let currentWeekHits = {};

    for (let week of weeksData) {
        let parts = week.startDate.split(" ");
        let monthMap = {"Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,"Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11};
        let baseDate = new Date(parts[2], monthMap[parts[1]], parseInt(parts[0]));

        for (let day of week.days) {
            let dDate = new Date(baseDate);
            dDate.setDate(dDate.getDate() + dayOrder.indexOf(day.dayName));
            let ts = dDate.getTime();

            for (let t of timeOrd) {
                let val = day.draws[t];
                if (!val || val === "-" || val === "PENDING") continue;
                let num = parseInt(val);
                if (num < 1 || num > 36) continue;
                
                if (week.isCurrentWeek) currentWeekHits[num] = (currentWeekHits[num] || 0) + 1;
                
                lastSeenTime[num] = timeNames[t] || t;

                if (!markInfo[num]) markInfo[num] = { frequency: 0, lastDate: null, history: [] };
                markInfo[num].frequency++;
                markInfo[num].lastDate = dDate;
                markInfo[num].history.push({ ts, date: dDate.toDateString(), time: lastSeenTime[num] });
            }
        }
    }

    let nowTs = Date.now();
    for (let n = 1; n <= 36; n++) {
        let info = markInfo[n];
        if (info && info.history.length > 1) {
            let gaps = [];
            let sortedH = info.history.sort((a, b) => a.ts - b.ts);
            for (let i = 0; i < sortedH.length - 1; i++) gaps.push((sortedH[i+1].ts - sortedH[i].ts) / 86400000);
            if (gaps.length > 0) intervals[n] = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
        }
    }

    let marks = [];
    for (let n = 1; n <= 36; n++) {
        let info = markInfo[n] || { frequency: 0, lastDate: null };
        let daysAgo = info.lastDate ? Math.floor((nowTs - info.lastDate.getTime()) / 86400000) : 999;
        let dateStr = info.lastDate ? info.lastDate.toLocaleDateString("en-GB", { day: '2-digit', month: 'short' }) : "N/A";
        
        marks.push({
            num: n, spirit: spirits[n] || "Unknown", days: daysAgo, date: dateStr,
            avg: intervals[n] || 12, frequency: info.frequency, time: lastSeenTime[n] || "N/A",
            isHitThisWeek: !!currentWeekHits[n]
        });
    }
    
    const allTimeline = [];
    const sortedWeeks = [...weeksData].sort((a, b) => {
        let pa = a.startDate.split(" ");
        let pb = b.startDate.split(" ");
        return new Date(pa[2] + "-" + pa[1] + "-" + pa[0]) - new Date(pb[2] + "-" + pb[1] + "-" + pb[0]);
    });
    
    const hotWeeksCount = 6;
    const startIdx = Math.max(0, sortedWeeks.length - hotWeeksCount - 1);
    const hotWeeks = sortedWeeks.slice(startIdx, -1);
    
    for (const week of hotWeeks) {
        const weekStart = new Date(week.startDate);
        for (let d = 0; d < dayOrder.length; d++) {
            const drawDate = new Date(weekStart);
            drawDate.setDate(weekStart.getDate() + d);
            for (const slot of timeOrd) {
                const day = week.days.find(dy => dy.dayName === dayOrder[d]);
                if (!day) continue;
                const val = day.draws[slot];
                if (val && val !== "-" && val !== "PENDING") {
                    const num = parseInt(val);
                    if (num >= 1 && num <= 36) allTimeline.push({ num, date: drawDate, timestamp: drawDate.getTime() });
                }
            }
        }
    }
    
    const frequency = {};
    for (let i = 1; i <= 36; i++) frequency[i] = 0;
    
    const currentWeekDraws = Object.keys(currentWeekHits).map(Number);
    allTimeline.forEach(entry => {
        if (!currentWeekDraws.includes(entry.num)) frequency[entry.num] = (frequency[entry.num] || 0) + 1;
    });
    
    const hotMarks = Object.entries(frequency)
        .filter(([num, count]) => count > 0 && !currentWeekDraws.includes(parseInt(num)))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([num, count]) => ({ num: parseInt(num), count, spirit: spirits[parseInt(num)] || "Unknown" }));

    let overdueMarks = marks.sort((a, b) => b.days - a.days).slice(0, 6).map(m => ({
        num: m.num, days: m.days, spirit: m.spirit,
        color: m.days >= 42 ? '#ff453a' : (m.days >= 35 ? '#ff9f0a' : (m.days >= 28 ? '#007AFF' : '#32d74b'))
    }));

    return { marks, intervals, numberColors, hotMarks, overdueMarks };
}

function renderPlayWheShelfContainer(marks, numberColors, intervals, hotMarks, overdueMarks) {
    if (!marks || marks.length === 0) return '<div style="text-align:center; padding:40px; color:#999;">No shelf data available</div>';

    const sortedMarks = [...marks].sort((a, b) => b.days - a.days);
    
    let overdueBadgeText = "Last ";
    if (overdueMarks && overdueMarks.length > 0) {
        const maxDays = overdueMarks[0].days;
        if (maxDays >= 7) {
            const weeks = Math.floor(maxDays / 7);
            overdueBadgeText += weeks + " Week" + (weeks > 1 ? "s" : "");
        } else {
            overdueBadgeText += maxDays + " Day" + (maxDays > 1 ? "s" : "");
        }
    } else overdueBadgeText = "None";

    let html = `
    <style>
        .shelf-container { padding: -19px 0px; max-width: 100%; margin: 0 auto; }
        .top-marks-container { display: flex; gap: 12px; margin-bottom: 12px; }
        .top-marks-box { flex: 1; background: #ffffff; border-radius: 10px; padding: 10px 12px; border: 1px solid #e0e0e0; min-width: 0; }
        .top-marks-box .box-title { font-size: 11px; font-weight: 800; color: #000000; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; text-align: center; border-bottom: 2px solid #000000; padding-bottom: 4px; }
        .top-marks-box .box-title .badge { font-size: 9px; font-weight: 700; background: #000000; color: #ffffff; padding: 1px 8px; border-radius: 10px; margin-left: 6px; }
        .top-marks-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .top-mark-cell { background: #f8f8f8; border-radius: 8px; padding: 6px 4px; text-align: center; border: 1px solid #e8e8e8; min-height: 50px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .top-mark-cell .ball-small { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; color: #000; margin: 0 auto 2px auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .top-mark-cell .stat { font-size: 10px; font-weight: 700; color: #000000; line-height: 1.3; text-align: center; }
        .top-mark-cell .stat.hot-count { color: #ff453a; }
        .top-mark-cell .stat.overdue-days { padding: 1px 6px; border-radius: 8px; color: #ffffff; font-size: 10px; font-weight: 700; display: inline-block; }
        .top-mark-cell .spirit-name { font-size: 7px; color: #888888; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .top-mark-cell.empty-cell { background: transparent; border: 1px dashed #e0e0e0; color: #cccccc; font-size: 10px; }
        .shelf-divider { border: none; border-top: 3px solid #000000; margin: 6px 0 12px 0; }
        .shelf-header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 4px; }
        .shelf-header-bar .title { font-weight: 900; font-size: 16px; color: #000000; }
        .shelf-header-bar .count { font-size: 10px; color: #666666; }
        .shelf-scroll { max-height: 411px; overflow-y: auto; -webkit-overflow-scrolling: touch; padding-right: 4px; }
        .shelf-scroll::-webkit-scrollbar { width: 4px; }
        .shelf-scroll::-webkit-scrollbar-track { background: #f0f0f0; border-radius: 10px; }
        .shelf-scroll::-webkit-scrollbar-thumb { background: #007AFF; border-radius: 10px; }
        .shelf-card { background: #ffffff; border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; border: 1px solid #e0e0e0; }
        .shelf-ball { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; color: #000; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
        .shelf-spirit { font-weight: 800; font-size: 14px; color: #000000; margin-left: 10px; }
        .shelf-confidence { font-size: 14px; font-weight: 900; color: #000000; }
        .shelf-confidence-label { font-size: 8px; color: #888888; }
        .shelf-bar { width: 100%; height: 4px; background: #e0e0e0; border-radius: 10px; overflow: hidden; margin-bottom: 8px; }
        .shelf-bar-fill { height: 100%; border-radius: 10px; }
        .shelf-stats { display: flex; justify-content: space-around; background: #f5f5f5; padding: 4px 6px; border-radius: 6px; border: 0.5px solid #e0e0e0; text-align: center; }
        .shelf-stat-label { font-size: 7px; color: #888888; text-transform: uppercase; }
        .shelf-stat-value { font-size: 10px; font-weight: 700; color: #000000; }
        .shelf-stat-value.hits { color: #32d74b; }
    </style>
    
    <div class="shelf-container">
        <div class="top-marks-container">
            <div class="top-marks-box">
                <div class="box-title">🔥 HOT MARKS <br><span class="badge">Last 6 Weeks</span></div>
                <div class="top-marks-grid">
    `;

    if (hotMarks && hotMarks.length > 0) {
        for (let i = 0; i < 6; i++) {
            if (i < hotMarks.length) {
                const m = hotMarks[i];
                const numStr = String(m.num).padStart(2, '0');
                const ballColor = numberColors[numStr] || '#ffffff';
                html += `<div class="top-mark-cell"><div class="ball-small" style="background:${ballColor};">${m.num}</div><div class="stat hot-count">${m.count}x</div><div class="spirit-name">${m.spirit.substring(0, 8)}</div></div>`;
            } else html += `<div class="top-mark-cell empty-cell">—</div>`;
        }
    } else html += `<div class="top-mark-cell empty-cell" style="grid-column: span 3;">No hot marks</div>`;

    html += `</div></div><div class="top-marks-box"><div class="box-title">⏰ OVERDUE MARKS <br><span class="badge">${overdueBadgeText}</span></div><div class="top-marks-grid">`;

    if (overdueMarks && overdueMarks.length > 0) {
        for (let i = 0; i < 6; i++) {
            if (i < overdueMarks.length) {
                const m = overdueMarks[i];
                const numStr = String(m.num).padStart(2, '0');
                const ballColor = numberColors[numStr] || '#ffffff';
                const bgColor = m.days >= 42 ? '#ff453a' : (m.days >= 35 ? '#ff9f0a' : (m.days >= 28 ? '#007AFF' : '#32d74b'));
                const weeks = Math.floor(m.days / 7);
                const days = m.days % 7;
                const displayText = weeks > 0 ? `${weeks}w ${days}d` : `${days}d`;
                html += `<div class="top-mark-cell"><div class="ball-small" style="background:${ballColor};">${m.num}</div><div class="stat overdue-days" style="background:${bgColor};">${displayText}</div><div class="spirit-name">${m.spirit.substring(0, 8)}</div></div>`;
            } else html += `<div class="top-mark-cell empty-cell">—</div>`;
        }
    } else html += `<div class="top-mark-cell empty-cell" style="grid-column: span 3; color:#32d74b;">✅ No overdue</div>`;

    html += `</div></div></div><hr class="shelf-divider"><div class="shelf-header-bar"><span class="title">♠️ PlayWhe Shelf Marks</span><span class="count">${sortedMarks.length} marks • ${sortedMarks.filter(m => m.days > (intervals[m.num] || 12)).length} due</span></div><div class="shelf-scroll">`;

    sortedMarks.forEach(m => {
        let avg = intervals[m.num] || 12;
        let confidence = Math.min(Math.round((m.days / avg) * 100), 100);
        let accentColor = '#32d74b';
        if (m.days > avg) accentColor = '#ff453a';
        else if (m.days > (avg * 0.75)) accentColor = '#ff9f0a';
        
        const numStr = String(m.num).padStart(2, '0');
        const ballColor = numberColors[numStr] || '#ffffff';
        
        html += `<div class="shelf-card" style="border-left: 4px solid ${accentColor};">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                <div style="display:flex; align-items:center;">
                    <div class="shelf-ball" style="background:${ballColor};">${m.num}</div>
                    <div class="shelf-spirit">${m.spirit}</div>
                </div>
                <div style="text-align:right;">
                    <div class="shelf-confidence-label">CONFIDENCE</div>
                    <div class="shelf-confidence">${confidence}%</div>
                </div>
            </div>
            <div class="shelf-bar"><div class="shelf-bar-fill" style="width:${confidence}%; background:${accentColor};"></div></div>
            <div class="shelf-stats">
                <div><div class="shelf-stat-label">HITS</div><div class="shelf-stat-value hits">${m.frequency}x</div></div>
                <div><div class="shelf-stat-label">AVG GAP</div><div class="shelf-stat-value">${avg}d</div></div>
                <div><div class="shelf-stat-label">SINCE</div><div class="shelf-stat-value" style="color:${accentColor};">${m.days}d</div></div>
                <div><div class="shelf-stat-label">LAST</div><div class="shelf-stat-value" style="font-size:8px;">${m.date}</div></div>
            </div>
        </div>`;
    });

    html += `</div></div>`;
    return html;
}

// =====================================
// WHEWHE WEEKEND PICKS
// =====================================
function renderWheWheWeekendPicks(weeksData) {
  if (!weeksData || weeksData.length === 0) {
    return `<div style="background: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #dddddd; text-align:center; color:#999;">📊 No data available</div>`;
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const slots = ["MOR", "MID", "NON", "EVE"];
  const weekendDays = ["Friday", "Saturday", "Sunday"];
  
  const spiritEmoji = {
    1: "🔪", 2: "👵🏾", 3: "🚕", 4: "⚰️", 5: "👨🏾‍🦳", 6: "🤰🏽", 7: "🐗", 8: "🐯",
    9: "🐮", 10: "🐒", 11: "🦅", 12: "🤴🏽", 13: "🐸", 14: "💰", 15: "🤧", 16: "💃🏽",
    17: "🐦‍⬛", 18: "🚤", 19: "🐎", 20: "🐶", 21: "👄", 22: "🐀", 23: "🏡", 24: "🫅🏽",
    25: "🐢", 26: "🐔", 27: "🐍", 28: "🐟", 29: "🍻", 30: "🐈‍⬛", 31: "👵🏾", 32: "🦐",
    33: "🕷️", 34: "👨🏾‍🦯", 35: "🐍", 36: "🫏"
  };

  const spiritNames = {
    1: "Centipede", 2: "Old Lady", 3: "Carriage", 4: "Dead Man", 5: "Parson Man",
    6: "Belly", 7: "Hog", 8: "Tiger", 9: "Cattle", 10: "Monkey",
    11: "Corbeau", 12: "King", 13: "Crapaud", 14: "Money", 15: "Sick Woman",
    16: "Jamette", 17: "Pigeon", 18: "Water Boat", 19: "Horse", 20: "Dog",
    21: "Mouth", 22: "Rat", 23: "House", 24: "Queen", 25: "Morrocoy",
    26: "Fowl", 27: "Little Snake", 28: "Red Fish", 29: "Opium Man", 30: "House Cat",
    31: "Parson Wife", 32: "Shrimp", 33: "Spider", 34: "Blind Man", 35: "Big Snake", 36: "Donkey"
  };

  const sortedWeeks = [...weeksData].sort((a, b) => {
    let pa = a.startDate.split(" ");
    let pb = b.startDate.split(" ");
    return new Date(pa[2] + "-" + pa[1] + "-" + pa[0]) - new Date(pb[2] + "-" + pb[1] + "-" + pb[0]);
  });

  const currentWeek = sortedWeeks[sortedWeeks.length - 1];
  const previousWeek = sortedWeeks.length >= 2 ? sortedWeeks[sortedWeeks.length - 2] : currentWeek;
  const historicalWeeks = sortedWeeks.slice(0, -1);

  const now = new Date();
  const todayIdx = now.getDay();
  const todayName = dayNames[todayIdx];
  const currentHour = now.getHours();

  function shouldShowContainer() {
    const isThursday = todayName === "Thursday";
    const isFriday = todayName === "Friday";
    const isSaturday = todayName === "Saturday";
    const isSunday = todayName === "Sunday";
    
    if (isThursday && currentHour < 18) return false;
    if (todayName === "Monday" || todayName === "Tuesday" || todayName === "Wednesday") return false;
    if (isThursday && currentHour >= 18) return true;
    if (isFriday || isSaturday || isSunday) return true;
    return false;
  }

  function getDraw(week, dayName, slot) {
    if (!week) return null;
    const day = week.days.find(d => d.dayName === dayName);
    if (!day) return null;
    const val = day.draws[slot];
    return val && val !== "-" && val !== "PENDING" && val !== "HOLIDAY" ? parseInt(val, 10) : null;
  }

  function getDrawWithDate(week, dayName, slot) {
    if (!week) return null;
    const day = week.days.find(d => d.dayName === dayName);
    if (!day) return null;
    const val = day.draws[slot];
    if (val && val !== "-" && val !== "PENDING" && val !== "HOLIDAY") {
      const parts = week.startDate.split(" ");
      const monthMap = {"Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,"Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11};
      const startDate = new Date(parts[2], monthMap[parts[1]], parseInt(parts[0]));
      const dayIndex = dayNames.indexOf(dayName);
      const drawDate = new Date(startDate);
      drawDate.setDate(startDate.getDate() + dayIndex);
      return { value: parseInt(val, 10), date: drawDate, slot: slot };
    }
    return null;
  }

  function isHolidayDay(week, dayName) {
    if (!week) return true;
    const day = week.days.find(d => d.dayName === dayName);
    if (!day) return true;
    return slots.every(slot => {
      const val = day.draws[slot];
      return !val || val === "-" || val === "PENDING" || val === "HOLIDAY";
    });
  }

  function collectHistoricalWeekendDraws() {
    const weekendDraws = [];
    for (const week of historicalWeeks) {
      for (const dayName of weekendDays) {
        if (isHolidayDay(week, dayName)) continue;
        for (const slot of slots) {
          const draw = getDraw(week, dayName, slot);
          if (draw) {
            weekendDraws.push({
              num: draw, day: dayName, slot: slot, weekStart: week.startDate,
              date: getDrawWithDate(week, dayName, slot)?.date || null
            });
          }
        }
      }
    }
    return weekendDraws;
  }

  function getCombinedFrequency(weekendDraws) {
    const counts = {};
    for (let i = 1; i <= 36; i++) counts[i] = 0;
    weekendDraws.forEach(d => counts[d.num] = (counts[d.num] || 0) + 1);
    const total = weekendDraws.length;
    const percentages = {};
    for (let i = 1; i <= 36; i++) percentages[i] = total > 0 ? (counts[i] / total) * 100 : 0;
    return { counts, percentages, total };
  }

  function getAllPlayedForDay(targetDay, weekendDraws) {
    const dayDraws = weekendDraws.filter(d => d.day === targetDay);
    const counts = {};
    for (let i = 1; i <= 36; i++) counts[i] = 0;
    dayDraws.forEach(d => counts[d.num] = (counts[d.num] || 0) + 1);
    return Object.entries(counts)
      .filter(([num, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(entry => ({
        num: parseInt(entry[0]), count: entry[1],
        emoji: spiritEmoji[entry[0]] || '', spirit: spiritNames[entry[0]] || 'Unknown'
      }));
  }

  function getTopMarks(weekendDraws, combinedFrequency) {
    const numberStats = {};
    for (let i = 1; i <= 36; i++) numberStats[i] = { count: 0, lastDate: null };
    
    for (const draw of weekendDraws) {
      numberStats[draw.num].count++;
      if (!numberStats[draw.num].lastDate || (draw.date && draw.date > numberStats[draw.num].lastDate)) {
        numberStats[draw.num].lastDate = draw.date;
      }
    }
    
    const now = new Date();
    return Object.entries(numberStats)
      .map(([num, stats]) => {
        let recencyScore = 0;
        if (stats.lastDate) {
          const daysAgo = Math.floor((now - stats.lastDate) / (1000 * 60 * 60 * 24));
          recencyScore = Math.max(0, 30 - daysAgo);
        }
        const combinedFreq = combinedFrequency.percentages[parseInt(num)] || 0;
        const totalScore = (stats.count * 2) + recencyScore + (combinedFreq * 0.5);
        return {
          num: parseInt(num), count: stats.count, recency: recencyScore,
          score: Math.round(totalScore),
          emoji: spiritEmoji[parseInt(num)] || '',
          spirit: spiritNames[parseInt(num)] || 'Unknown'
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 7);
  }

  function getCurrentWeekDraw(dayName, slot) {
    return getDraw(currentWeek, dayName, slot);
  }

  function generatePicksForSlots(weekendDraws, combinedFrequency) {
    const picks = {};
    
    function getAnchorNumber(targetDay, targetSlot) {
      return getDraw(previousWeek, targetDay, targetSlot);
    }
    
    function getHistoricalFollowers(anchorNum, targetDay, targetSlot) {
      const followers = {};
      for (let i = 1; i <= 36; i++) followers[i] = 0;
      for (const week of historicalWeeks) {
        const targetIdx = dayNames.indexOf(targetDay);
        const prevDayIdx = (targetIdx - 1 + 7) % 7;
        const prevDay = dayNames[prevDayIdx];
        const anchorDraw = getDraw(week, prevDay, "EVE");
        if (anchorDraw === anchorNum) {
          const followDraw = getDraw(week, targetDay, targetSlot);
          if (followDraw) followers[followDraw] = (followers[followDraw] || 0) + 1;
        }
      }
      return followers;
    }
    
    function calculateCombinedProbability(num, slotDraws, historicalFollowers, chart16, chart8, dayDraws) {
      let score = 0;
      const slotTotal = slotDraws.length;
      const slotCount = slotDraws.filter(d => d.num === num).length;
      score += slotTotal > 0 ? (slotCount / slotTotal) * 15 : 0;
      
      const combinedFreq = combinedFrequency.percentages[num] || 0;
      score += (combinedFreq / 100) * 20;
      
      const followCount = historicalFollowers[num] || 0;
      const totalFollowers = Object.values(historicalFollowers).reduce((a, b) => a + b, 0);
      score += totalFollowers > 0 ? (followCount / totalFollowers) * 20 : 0;
      
      if (chart16.includes(num)) score += 15;
      if (chart8.includes(num)) score += 10;
      if (chart16.includes(num) && chart8.includes(num)) score += 5;
      
      const recentDraws = slotDraws.slice(-8 * 4);
      const recentCount = recentDraws.filter(d => d.num === num).length;
      score += recentDraws.length > 0 ? (recentCount / recentDraws.length) * 10 : 0;
      
      const dayTotal = dayDraws.length;
      const dayCount = dayDraws.filter(d => d.num === num).length;
      score += dayTotal > 0 ? (dayCount / dayTotal) * 5 : 0;
      
      return Math.round(score);
    }
    
    for (const day of weekendDays) {
      const dayDraws = weekendDraws.filter(d => d.day === day);
      const slotPicks = {};
      
      for (const slot of slots) {
        const anchorNum = getAnchorNumber(day, slot);
        const chart16 = anchorNum ? (CHART_1_16[anchorNum] || []) : [];
        const chart8 = anchorNum ? (CHART_1_8[anchorNum] || []) : [];
        const historicalFollowers = getHistoricalFollowers(anchorNum, day, slot);
        const slotDraws = dayDraws.filter(d => d.slot === slot);
        
        const scored = [];
        for (let i = 1; i <= 36; i++) {
          scored.push({
            num: i,
            score: calculateCombinedProbability(i, slotDraws, historicalFollowers, chart16, chart8, dayDraws),
            emoji: spiritEmoji[i] || '', spirit: spiritNames[i] || 'Unknown',
            count: slotDraws.filter(d => d.num === i).length || 0,
            anchorNum
          });
        }
        
        slotPicks[slot] = scored.sort((a, b) => b.score - a.score).slice(0, 4);
      }
      
      picks[day] = { slots: slotPicks, anchorNums: slots.reduce((acc, slot) => { acc[slot] = getAnchorNumber(day, slot); return acc; }, {}) };
    }
    return picks;
  }

  function checkMatch(pickNum, actualDraw) {
    if (!actualDraw) return null;
    return pickNum === actualDraw;
  }

  function getLeavingMeeting() {
    let leavingNumber = null, leavingSlot = null, leavingDayIdx = -1, leavingSlotIdx = -1;
    
    for (let d = todayIdx; d >= 0; d--) {
      for (let s = slots.length - 1; s >= 0; s--) {
        const draw = getDraw(currentWeek, dayNames[d], slots[s]);
        if (draw) {
          leavingNumber = draw;
          leavingSlot = slots[s];
          leavingDayIdx = d;
          leavingSlotIdx = s;
          break;
        }
      }
      if (leavingNumber) break;
    }
    
    let meetingNumber = null, meetingSlot = null;
    
    if (leavingDayIdx !== -1 && leavingSlotIdx !== -1) {
      let nextDayIdx = leavingDayIdx;
      let nextSlotIdx = leavingSlotIdx + 1;
      if (nextSlotIdx >= slots.length) { nextSlotIdx = 0; nextDayIdx = leavingDayIdx + 1; }
      if (nextDayIdx >= dayNames.length) nextDayIdx = 0;
      
      if (nextDayIdx < dayNames.length && nextDayIdx >= 0) {
        const targetDay = dayNames[nextDayIdx];
        const targetSlot = slots[nextSlotIdx];
        meetingNumber = getDraw(previousWeek, targetDay, targetSlot);
        if (meetingNumber) meetingSlot = targetSlot;
        else {
          const draw = getDraw(currentWeek, targetDay, targetSlot);
          if (draw) { meetingNumber = draw; meetingSlot = targetSlot; }
        }
      }
    }
    
    return { leavingNumber, leavingSlot, meetingNumber, meetingSlot };
  }

  function getUnderToday() {
    const underToday = {};
    for (const day of weekendDays) {
      const dayData = {};
      for (const slot of slots) dayData[slot] = getDraw(previousWeek, day, slot);
      underToday[day] = dayData;
    }
    return underToday;
  }
  
  const showContainer = shouldShowContainer();
  const weekendDraws = collectHistoricalWeekendDraws();
  const combinedFrequency = getCombinedFrequency(weekendDraws);
  
  const allPlayedFriday = getAllPlayedForDay("Friday", weekendDraws);
  const allPlayedSaturday = getAllPlayedForDay("Saturday", weekendDraws);
  const allPlayedSunday = getAllPlayedForDay("Sunday", weekendDraws);
  
  const topMarks = getTopMarks(weekendDraws, combinedFrequency);
  const slotPicks = generatePicksForSlots(weekendDraws, combinedFrequency);
  const leavingMeeting = getLeavingMeeting();
  const underToday = getUnderToday();
  
  const topOverall = Object.entries(combinedFrequency.counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([num, count]) => ({
      num: parseInt(num), count,
      percentage: Math.round((count / combinedFrequency.total) * 100),
      emoji: spiritEmoji[parseInt(num)] || ''
    }));
  
  if (weekendDraws.length === 0) {
    return `<div style="background: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #dddddd; text-align:center; color:#999;">📊 No weekend data available</div>`;
  }

  let defaultDayIndex = 0;
  if (weekendDays.includes(todayName)) defaultDayIndex = weekendDays.indexOf(todayName);
  
  const carouselId = 'weekendCarousel-' + Date.now();
  
  let carouselSlides = '';
  for (let d = 0; d < weekendDays.length; d++) {
    const day = weekendDays[d];
    const isActive = d === defaultDayIndex;
    const dayData = slotPicks[day] || { slots: {}, anchorNums: {} };
    const daySlots = dayData.slots || {};
    const dayUnderData = underToday[day] || {};
    
    carouselSlides += `
      <div class="weekend-carousel-slide" style="min-width: 100%; scroll-snap-align: start; padding: 0 4px; ${!isActive ? 'display: none;' : ''}" data-day="${day}">
        <div style="background: ${isActive ? 'rgba(255,157,0,0.05)' : 'rgba(255,255,255,0.02)'}; border-radius: 8px; padding: 6px; border: ${isActive ? '2px solid #ff9d00' : '1px solid #e0e0e0'}; margin-bottom: 6px;">
          <div style="text-align: center; margin-bottom: 4px;">
            <div style="font-size: 11px; font-weight: 700; color: ${isActive ? '#ff9d00' : '#666'};">${day.toUpperCase()} ${isActive ? '🔥 TODAY' : ''}</div>
          </div>
          
          <div style="margin-bottom: 6px; padding: 4px; background: #f5f5f5; border-radius: 6px; border: 1px solid #e0e0e0;">
            <div style="font-size: 8px; font-weight: 700; color: #000; text-align: center; margin-bottom: 2px;">📅 UNDER TODAY</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px;">
              ${slots.map(slot => {
                const draw = dayUnderData[slot];
                return `<div style="background: ${draw ? '#f8f8f8' : '#f0f0f0'}; border-radius: 3px; padding: 2px; text-align: center; font-size: 11px; font-weight: 700; color: ${draw ? '#000' : '#ccc'};">${draw ? draw : '—'}</div>`;
              }).join('')}
            </div>
          </div>
          
          <div style="display: flex; justify-content: center; gap: 16px; padding: 4px; background: #fafafa; border-radius: 6px; border: 1px solid #e0e0e0; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="color: #58a6ff; font-weight: 800; font-size: 10px;">🔵 LEAVING</span>
              <span style="font-size: 14px; font-weight: 900; color: #000;">${leavingMeeting.leavingNumber ? `#${leavingMeeting.leavingNumber}${spiritEmoji[leavingMeeting.leavingNumber] || ''}` : '—'}</span>
              <span style="font-size: 7px; color: #888;">${leavingMeeting.leavingSlot || ''}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="color: #ff9d00; font-weight: 800; font-size: 10px;">🟡 MEETING</span>
              <span style="font-size: 14px; font-weight: 900; color: #000;">${leavingMeeting.meetingNumber ? `#${leavingMeeting.meetingNumber}${spiritEmoji[leavingMeeting.meetingNumber] || ''}` : '—'}</span>
              <span style="font-size: 7px; color: #888;">${leavingMeeting.meetingSlot || ''}</span>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
    `;

    for (const slot of slots) {
      const picks = daySlots[slot] || [];
      const actualDraw = getCurrentWeekDraw(day, slot);
      
      carouselSlides += `<div style="background: #f8f8f8; border-radius: 6px; padding: 4px; border: 1px solid #e8e8e8;"><div style="text-align: center; font-size: 8px; font-weight: 700; color: #888; margin-bottom: 2px;">${slot}</div>`;

      for (let i = 0; i < 4; i++) {
        if (i < picks.length) {
          const pick = picks[i];
          const matched = checkMatch(pick.num, actualDraw);
          
          let bgColor = '#f8f8f8', borderColor = '#e8e8e8', textColor = '#888', statusLabel = '⏳';
          if (matched === true) { bgColor = '#d4edda'; borderColor = '#28a745'; textColor = '#155724'; statusLabel = '✅'; }
          else if (matched === false) { bgColor = '#f5f5f5'; borderColor = '#cccccc'; textColor = '#999'; statusLabel = '❌'; }
          
          carouselSlides += `<div style="background: ${bgColor}; border-radius: 3px; padding: 1px 2px; border: 1px solid ${borderColor}; text-align: center; margin-bottom: 1px;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                <span style="font-size: 11px; font-weight: 800; color: ${textColor};">${pick.num}</span>
                <span style="font-size: 8px;">${pick.emoji}</span>
                <span style="font-size: 7px; color: ${textColor};">${statusLabel}</span>
              </div>
              <div style="display: flex; justify-content: center; gap: 3px; font-size: 6px; color: #999;">
                <span>${pick.count}x</span><span>•</span>
                <span style="color: ${pick.score >= 70 ? '#28a745' : (pick.score >= 50 ? '#ff9d00' : '#ff453a')}; font-weight: 700;">${pick.score}%</span>
              </div>
            </div>`;
        } else {
          carouselSlides += `<div style="background: #f5f5f5; border-radius: 3px; padding: 1px 2px; border: 1px dashed #dddddd; text-align: center; color: #ccc; font-size: 10px;">—</div>`;
        }
      }

      carouselSlides += `<div style="text-align: center; font-size: 12px; color: #000; margin-top: 2px; padding-top: 2px; border-top: 1px solid #e8e8e8;"><span style="font-weight: 700;">DRAW:</span> <br>${actualDraw ? `${actualDraw}${spiritEmoji[actualDraw] || ''}` : '⏳ Pending'}</div></div>`;
    }

    carouselSlides += `</div></div></div>`;
  }

  let html = `
    <div style="background: #ffffff; border-radius: 12px; padding: 12px; border: 1px solid #dddddd; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 5px;">
      <div style="text-align: center; margin-bottom: 5px;">
        <div style="font-size: 16px; font-weight: 900; color: #000; letter-spacing: 0.5px;">🏆 WHEWHE PICKS EVERY FRI-SAT-SUN 🏆</div>
        <div style="font-size: 8px; color: #999; margin-top: 2px;">${showContainer ? '🟢 Active - Thursday EVE to Sunday' : '⏳ Available from Thursday EVE'}</div>
      </div>
  `;

  if (!showContainer) {
    html += `<div style="text-align: center; padding: 20px; background: #f8f8f8; border-radius: 8px; border: 1px dashed #dddddd;">
        <div style="font-size: 24px; margin-bottom: 8px;">⏳</div>
        <div style="font-size: 14px; font-weight: 700; color: #666;">Will Be Available Shortly</div>
        <div style="font-size: 10px; color: #999; margin-top: 4px;">Container activates from Thursday Evening (6pm) through Sunday</div>
      </div>`;
  } else {
    html += `<div style="margin-bottom: 6px;"><div style="font-size: 11px; font-weight: 800; color: #000; text-align: center; margin-bottom: 3px; background: #f0f0f0; padding: 4px; border-radius: 4px;">⚜️ TOP OVERALL WEEKEND NUMBERS</div><div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; max-height: 60px; overflow-y: auto;">`;
    
    for (const item of topOverall) {
      const hitColor = item.count >= 10 ? '#28a745' : (item.count >= 5 ? '#ff9d00' : '#666');
      html += `<div style="background: #f8f8f8; border-radius: 4px; padding: 2px 8px; text-align: center; border: 1px solid #e8e8e8; display: inline-flex; align-items: center; gap: 4px;">
          <span style="font-size: 13px; font-weight: 800; color: #000;">${item.num}</span>
          <span style="font-size: 7px;">${item.emoji}</span>
          <span style="font-size: 7px; color: ${hitColor}; font-weight: 700;">${item.count}x</span>
          <span style="font-size: 6px; color: #58a6ff;">${item.percentage}%</span>
        </div>`;
    }
    
    html += `</div></div>`;

    html += `<div style="margin-bottom: 6px;"><div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">`;

    const allPlayedData = [
      { day: "Friday", data: allPlayedFriday, emoji: "🌅" },
      { day: "Saturday", data: allPlayedSaturday, emoji: "🌤️" },
      { day: "Sunday", data: allPlayedSunday, emoji: "🌙" }
    ];

    for (const data of allPlayedData) {
      const isToday = data.day === todayName;
      html += `<div style="background: ${isToday ? 'rgba(255,157,0,0.08)' : 'rgba(255,255,255,0.03)'}; border-radius: 8px; padding: 6px; border: ${isToday ? '2px solid #ff9d00' : '1px solid #e0e0e0'};">
          <div style="text-align: center; font-size: 10px; font-weight: 700; color: ${isToday ? '#ff9d00' : '#666'}; margin-bottom: 4px;">
            ${data.emoji} ${data.day.toUpperCase()} ${isToday ? '🔥' : ''}
            <span style="font-size: 7px; color: #999; display: block;">${data.data.length} numbers played</span>
          </div>
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 3px; max-height: 120px; overflow-y: auto;">`;
      
      for (const item of data.data) {
        const hitColor = item.count >= 5 ? '#28a745' : (item.count >= 3 ? '#ff9d00' : '#666');
        html += `<div style="background: #f8f8f8; border-radius: 4px; padding: 2px 4px; text-align: center; border: 1px solid #e8e8e8; display: inline-flex; align-items: center; gap: 2px;">
            <span style="font-size: 12px; font-weight: 800; color: #000;">${item.num}</span>
            <span style="font-size: 7px;">${item.emoji}</span>
            <span style="font-size: 7px; color: ${hitColor}; font-weight: 700;">${item.count}x</span>
          </div>`;
      }
      
      html += `</div></div>`;
    }

    html += `</div></div>`;

    html += `<div style="margin-bottom: 4px;"><div style="font-size: 11px; font-weight: 800; color: #000; text-align: center; margin-bottom: 4px; background: #f0f0f0; padding: 4px; border-radius: 4px;">🔥🔥 ⚜️TOP MARKS⚜️ 🔥🔥</div><div style="display: flex; flex-wrap: nowrap; justify-content: center; gap: 6px; overflow-x: auto; padding: 4px 0;">`;

    for (const mark of topMarks) {
      let bgColor = '#f8f8f8', borderColor = '#e0e0e0', scoreColor = '#666';
      if (mark.score >= 25) { bgColor = 'rgba(40, 167, 69, 0.1)'; borderColor = '#28a745'; scoreColor = '#28a745'; }
      else if (mark.score >= 18) { bgColor = 'rgba(255, 157, 0, 0.1)'; borderColor = '#ff9d00'; scoreColor = '#ff9d00'; }
      
      html += `<div style="display: inline-flex; flex-direction: column; align-items: center; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 6px; padding: 2px 8px; min-width: 40px;">
          <span style="font-size: 14px; font-weight: 900; color: #000;">${mark.num}</span>
          <span style="font-size: 8px;">${mark.emoji}</span>
          <div style="display: flex; gap: 3px; font-size: 6px; color: ${scoreColor}; font-weight: 700;"><span>${mark.count}x</span><span>•</span><span>${mark.score}%</span></div>
        </div>`;
    }

    html += `</div></div><hr style="border: none; border-top: 3px solid #000000; margin: 8px 0;">`;

    html += `<div style="margin-top: 4px;">
        <div style="font-size: 11px; font-weight: 800; color: #000; text-align: center; margin-bottom: 6px; background: #f0f0f0; padding: 4px; border-radius: 4px;">♠️ TOP 4 PICKS PER DRAW ♠️</div>
        <div style="font-size: 8px; color: #666; text-align: center; margin-bottom: 4px;">🟢 = Match • ⚪ = Not Played Yet • ⚫ = No Match • <span style="color: #ff9d00; font-weight: 700;">← Swipe →</span></div>
        <div style="position: relative; overflow: hidden;">
          <div id="${carouselId}" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; gap: 8px; padding: 4px 0; scrollbar-width: none;">${carouselSlides}</div>
          <div style="display: flex; justify-content: center; gap: 6px; margin-top: 4px;">
            ${weekendDays.map((day, idx) => `<span class="carousel-dot-${carouselId}" data-index="${idx}" onclick="goToWeekendSlide_${carouselId.replace(/-/g, '_')}(${idx})" style="width: 10px; height: 10px; background: ${idx === defaultDayIndex ? '#ff9d00' : '#ccc'}; border-radius: 50%; cursor: pointer; display: inline-block;"></span>`).join('')}
          </div>
        </div>
      </div>`;

    html += `<script>
        (function() {
          const carousel = document.getElementById('${carouselId}');
          if (!carousel) return;
          const slides = carousel.querySelectorAll('.weekend-carousel-slide');
          const dots = document.querySelectorAll('.carousel-dot-${carouselId}');
          let currentIndex = ${defaultDayIndex};
          let totalSlides = slides.length;
          
          function updateSlides(index) {
            slides.forEach((slide, i) => { slide.style.display = i === index ? 'block' : 'none'; });
            dots.forEach((dot, i) => { dot.style.background = i === index ? '#ff9d00' : '#ccc'; });
            currentIndex = index;
          }
          
          window.goToWeekendSlide_${carouselId.replace(/-/g, '_')} = function(index) {
            if (index >= 0 && index < totalSlides) updateSlides(index);
          };
          
          let startX = 0, isDragging = false;
          carousel.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; isDragging = true; });
          carousel.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            const diff = startX - e.touches[0].clientX;
            if (Math.abs(diff) > 50) {
              isDragging = false;
              let newIndex = currentIndex + (diff > 0 ? 1 : -1);
              if (newIndex < 0) newIndex = totalSlides - 1;
              if (newIndex >= totalSlides) newIndex = 0;
              updateSlides(newIndex);
            }
          });
          carousel.addEventListener('touchend', function() { isDragging = false; });
          
          updateSlides(${defaultDayIndex});
        })();
      </script>`;

    html += `<div style="display: flex; justify-content: center; gap: 12px; font-size: 7px; color: #666; padding: 4px; background: #f5f5f5; border-radius: 4px; flex-wrap: wrap; margin-top: 4px;">
        <span><span style="display: inline-block; width: 10px; height: 10px; background: #d4edda; border: 1px solid #28a745; border-radius: 2px; vertical-align: middle;"></span> MATCH</span>
        <span><span style="display: inline-block; width: 10px; height: 10px; background: #f5f5f5; border: 1px solid #cccccc; border-radius: 2px; vertical-align: middle;"></span> NO MATCH</span>
        <span><span style="display: inline-block; width: 10px; height: 10px; background: #f8f8f8; border: 1px solid #e8e8e8; border-radius: 2px; vertical-align: middle;"></span> NOT PLAYED</span>
      </div>`;
  }

  html += `<div style="margin-top: 3px; padding-top: 6px; border-top: 1px solid #dddddd; display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap;"><span style="font-size: 7px; color: #666;">⚡ WheWhe Weekend Picks • CodeWithGlasgow ©️ CWG Builds</span></div></div>`;

  return html;
}

// ======================================
// CAROUSEL FUNCTIONS
// ======================================
function renderCarouselWithCurrentPW(weeks, containerId) {
  if (!weeks || weeks.length === 0) return "";
  
  const allWeeks = [...weeks];
  const currentWeek = allWeeks[allWeeks.length - 1];
  const previousWeeks = allWeeks.slice(0, -1);
  
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const allSlidesHtml = previousWeeks.reverse().map((wk, idx) => {
    const weekNum = previousWeeks.length - idx;
    const startLbl = formatDate(wk.startDate);
    const endLbl = wk.endDate ? formatDate(wk.endDate) : (() => {
      const sDate = new Date(wk.startDate);
      const eDate = new Date(sDate);
      eDate.setDate(sDate.getDate() + 6);
      return formatDate(eDate);
    })();

    let tableHtml = buildTable([wk], "P2WHE", currentWeek);
    tableHtml = tableHtml.replace(/<div class="carousel-table-header"><span>(CURRENT|PREVIOUS) WEEK<\/span><\/div>/, 
      `<div class="carousel-table-header"><span>⌛ WEEK ${weekNum}</span><span>${startLbl} - ${endLbl}</span></div>`);
      
    return `<div class="carousel-slide">${tableHtml}</div>`;
  }).join('');

  const currentStartDate = formatDate(currentWeek.startDate);
  const currentEndDate = currentWeek.endDate ? formatDate(currentWeek.endDate) : (() => {
    const sDate = new Date(currentWeek.startDate);
    const eDate = new Date(sDate);
    eDate.setDate(sDate.getDate() + 6);
    return formatDate(eDate);
  })();

  let currentTableHtml = buildTable([currentWeek], "P2WHE", currentWeek);
  currentTableHtml = currentTableHtml.replace(/<div class="carousel-table-header"><span>CURRENT WEEK<\/span><\/div>/, 
    `<div class="carousel-table-header carousel-current-header"><span>⚜️ CURRENT WEEK</span><span>${currentStartDate} - ${currentEndDate}</span><span>LIVE RESULTS</span></div>`);
  
  const currentSlideHtml = `<div class="carousel-slide">${currentTableHtml}</div>`;
  const allSlides = allSlidesHtml + currentSlideHtml;
  const totalSlides = allWeeks.length;
  
  const carouselHtml = `
  <div style="text-align: center; margin-bottom: 0px; position: relative; overflow: hidden;">
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 48px; font-weight: 900; color: rgba(0,0,0,0.04); letter-spacing: 8px; pointer-events: none; white-space: nowrap; z-index: 0;">CODEWITHGLASGOW</div>

  </div>
  
  <div class="carousel-container" id="${containerId}-carousel" style="margin-bottom: 8px; padding: 4px 0;">
    <div class="carousel-track" id="${containerId}-track" style="gap: 12px;">${allSlides}</div>
  </div>
  `;
  
  return carouselHtml + currentTableHtml;
}

function buildLineTable(weeks) {
  const numToLineMap = {
    1:1, 10:1, 19:1, 28:1, 2:2, 11:2, 20:2, 29:2, 3:3, 12:3, 21:3, 30:3,
    4:4, 13:4, 22:4, 31:4, 5:5, 14:5, 23:5, 32:5, 6:6, 15:6, 24:6, 33:6,
    7:7, 16:7, 25:7, 34:7, 8:8, 17:8, 26:8, 35:8, 9:9, 18:9, 27:9, 36:9
  };

  function isDrawTimePassed(weekStartDate, dayName, slot) {
    if (!weekStartDate) return false;
    const parts = weekStartDate.split(" ");
    const monthMap = {"Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,"Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11};
    const startDate = new Date(parts[2], monthMap[parts[1]], parseInt(parts[0]));
    const dayIndex = daysOfWeek.indexOf(dayName);
    if (dayIndex === -1) return false;
    const drawDate = new Date(startDate);
    drawDate.setDate(startDate.getDate() + dayIndex);
    const timeOffsets = { "MOR": 9, "MID": 12, "NON": 15, "EVE": 18 };
    drawDate.setHours(timeOffsets[slot] || 12);
    return drawDate < new Date();
  }

  function isHolidayDay(weekStartDate, day) {
    if (!day) return false;
    const allSlotsEmpty = timeOrder.every(slot => {
      const val = day.draws[slot];
      return !val || val === "-" || val === "PENDING";
    });
    if (!allSlotsEmpty) return false;
    return isDrawTimePassed(weekStartDate, day.dayName, "EVE");
  }

  let isAfterEvening = false;
  let highlightDayName = todayName;
  const currentWeekData = weeks.find(wk => wk.isCurrentWeek);
  
  if (currentWeekData) {
    let lastCompletedDayIndex = -1;
    for (let i = 0; i < daysOfWeek.length; i++) {
      const dayData = currentWeekData.days.find(d => d.dayName === daysOfWeek[i]);
      if (dayData) {
        const hasEveDraw = dayData.draws.EVE && dayData.draws.EVE !== "-" && dayData.draws.EVE !== "PENDING";
        const isHoliday = isHolidayDay(currentWeekData.startDate, dayData);
        if (hasEveDraw || isHoliday) {
          lastCompletedDayIndex = i;
          isAfterEvening = true;
        }
      }
    }
    if (lastCompletedDayIndex !== -1) {
      highlightDayName = isAfterEvening ? daysOfWeek[(lastCompletedDayIndex + 1) % 7] : daysOfWeek[lastCompletedDayIndex];
    }
  }

  return weeks.map(wk => {
    let headerRange = wk.isCurrentWeek ? "CURRENT WEEK" : "PREVIOUS WEEK";
    if (wk.startDate) {
      let start = new Date(wk.startDate);
      if (!isNaN(start.getTime())) {
        let end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
        let opt = { day: 'numeric', month: 'short', year: '2-digit' };
        headerRange += ` (${start.toLocaleDateString('en-GB', opt)} - ${end.toLocaleDateString('en-GB', opt)})`;
      }
    }

    return `
    <div class="carousel-table-wrapper">
      <div class="carousel-table-header" style="background: #1e293b; color: #ff9d00;"><span>${headerRange.toUpperCase()} </span></div>
      <table class="carousel-table">
        <tr><th>DAY</th><th>MOR</th><th>MID</th><th>NON</th><th>EVE</th></tr>
        ${wk.days.map((d, index) => {
          let isHighlighted = (d.dayName === highlightDayName);
          let dayDisplay = d.dayName.slice(0,3).toUpperCase();
          if (wk.startDate) {
            let start = new Date(wk.startDate);
            if (!isNaN(start.getTime())) {
              let currentDayDate = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
              dayDisplay += ` ${currentDayDate.getDate()}`;
            }
          }
          
          const allSlotsEmpty = timeOrder.every(slot => {
            const val = d.draws[slot];
            return !val || val === "-" || val === "PENDING";
          });
          
          if (!wk.isCurrentWeek && allSlotsEmpty) {
            return `<tr class="${isHighlighted ? 'carousel-current-day' : ''}">
              <td class="carousel-day-label">${(isHighlighted && isAfterEvening) ? "▶ " : ""}${dayDisplay}</td>
              <td colspan="4" style="text-align: center; padding: 8px; background: transparent;"><span style="color: #ff453a; font-weight: bold; font-size: 14px;">🇹🇹 HOLIDAY 🇹🇹</span></td>
            </tr>`;
          }

          return `<tr class="${isHighlighted ? 'carousel-current-day' : ''}">
            <td class="carousel-day-label">${(isHighlighted && isAfterEvening) ? "▶ " : ""}${dayDisplay}</td>
            ${timeOrder.map(s => {
              let val = String(d.draws[s]).trim();
              if (val === "-" || val === "PENDING" || val === "") return `<td>...</td>`;
              let match = val.match(/^(\d+)/);
              if (match) {
                let num = parseInt(match[1], 10);
                let lineId = numToLineMap[num] || "?";
                return `<td style="color:#000; font-weight:900;">${lineId}L</td>`;
              }
              return `<td>...</td>`;
            }).join("")}
          </tr>`;
        }).join("")}
      </table>
    </div>`;
  }).join('');
}

function buildTable(weeks, gameType, currentWeekDataParam = null) {
    function isDrawTimePassed(weekStartDate, dayName, slot) {
        if (!weekStartDate) return false;
        const parts = weekStartDate.split(" ");
        const monthMap = {"Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,"Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11};
        const startDate = new Date(parts[2], monthMap[parts[1]], parseInt(parts[0]));
        const dayIndex = daysOfWeek.indexOf(dayName);
        if (dayIndex === -1) return false;
        const drawDate = new Date(startDate);
        drawDate.setDate(startDate.getDate() + dayIndex);
        const timeOffsets = { "MOR": 9, "MID": 12, "NON": 15, "EVE": 18 };
        drawDate.setHours(timeOffsets[slot] || 12);
        return drawDate < new Date();
    }

    function isHolidayDay(weekStartDate, day) {
        if (!day) return false;
        const allSlotsEmpty = timeOrder.every(slot => {
            const val = day.draws[slot];
            return !val || val === "-" || val === "PENDING";
        });
        if (!allSlotsEmpty) return false;
        return isDrawTimePassed(weekStartDate, day.dayName, "EVE");
    }

    let currentWeekData = currentWeekDataParam || weeks.find(wk => wk.isCurrentWeek);
    if (!currentWeekData && weeks.length > 0) currentWeekData = weeks[weeks.length - 1];
    
    let isAfterEvening = false;
    let highlightDayName = todayName;
    
    if (currentWeekData) {
        let lastCompletedDayIndex = -1;
        for (let i = 0; i < daysOfWeek.length; i++) {
            const dayData = currentWeekData.days.find(d => d.dayName === daysOfWeek[i]);
            if (dayData) {
                const hasEveDraw = dayData.draws.EVE && dayData.draws.EVE !== "-" && dayData.draws.EVE !== "PENDING";
                const isHoliday = isHolidayDay(currentWeekData.startDate, dayData);
                if (hasEveDraw || isHoliday) {
                    lastCompletedDayIndex = i;
                    isAfterEvening = true;
                }
            }
        }
        if (lastCompletedDayIndex !== -1) {
            highlightDayName = isAfterEvening ? daysOfWeek[(lastCompletedDayIndex + 1) % 7] : daysOfWeek[lastCompletedDayIndex];
        }
    }

    return weeks.map(wk => {
        let headerRange = wk.isCurrentWeek ? "CURRENT WEEK" : "PREVIOUS WEEK";
        if (wk.startDate) {
            let start = new Date(wk.startDate);
            if (!isNaN(start.getTime())) {
                let end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
                let opt = { day: 'numeric', month: 'short', year: '2-digit' };
                headerRange += ` (${start.toLocaleDateString('en-GB', opt)} - ${end.toLocaleDateString('en-GB', opt)})`;
            }
        }

        return `
        <div class="carousel-table-wrapper">
            <div class="carousel-table-header"><span>${headerRange.toUpperCase()} </span></div>
            <table class="carousel-table">
                <tr><th>DAY</th><th>MOR</th><th>MID</th><th>NON</th><th>EVE</th></tr>
                ${wk.days.map((d, index) => {
                    let isHighlighted = (d.dayName === highlightDayName);
                    let dayDisplay = d.dayName.slice(0,3).toUpperCase();
                    if (wk.startDate) {
                        let start = new Date(wk.startDate);
                        if (!isNaN(start.getTime())) {
                            let currentDayDate = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
                            dayDisplay += ` ${currentDayDate.getDate()}`;
                        }
                    }
                    
                    const allSlotsEmpty = timeOrder.every(slot => {
                        const val = d.draws[slot];
                        return !val || val === "-" || val === "PENDING";
                    });
                    
                    if (!wk.isCurrentWeek && allSlotsEmpty) {
                        return `<tr class="${isHighlighted ? 'carousel-current-day' : ''}"><td class="carousel-day-label">${dayDisplay}</td><td colspan="4" style="text-align: center; padding: 8px;"><span style="color: #ff453a; font-weight: bold; font-size: 14px;">🇹🇹 HOLIDAY 🇹🇹</span></td></tr>`;
                    }
                    
                    if (wk.isCurrentWeek && allSlotsEmpty) {
                        const isEvePassed = isDrawTimePassed(wk.startDate, d.dayName, "EVE");
                        if (isEvePassed) {
                            return `<tr class="${isHighlighted ? 'carousel-current-day' : ''}"><td class="carousel-day-label">${dayDisplay}</td><td colspan="4" style="text-align: center; padding: 8px;"><span style="color: #ff453a; font-weight: bold; font-size: 14px;">🇹🇹 HOLIDAY 🇹🇹</span></td></tr>`;
                        }
                    }

                    return `<tr class="${isHighlighted ? 'carousel-current-day' : ''}">
                        <td class="carousel-day-label">${(isHighlighted && isAfterEvening) ? "▶ " : ""}${dayDisplay}</td>
                        ${timeOrder.map(s => {
                            let val = d.draws[s];
                            let displayVal = (!val || val === "-" || val === "PENDING") ? "..." : String(val).trim();
                            return `<td>${displayVal}</td>`;
                        }).join("")}
                    </tr>`;
                }).join("")}
            </table>
        </div>`;
    }).join('');
}

function renderUnifiedCarouselContainer(weeksData) {
    if (!weeksData || weeksData.length === 0) {
        return '<div style="background: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #dddddd; text-align:center; color:#999;">❌ No data available</div>';
    }
    
    const containerId = 'unified-' + Date.now();
    
    const pwWeeks = JSON.parse(JSON.stringify(weeksData.slice(-41)));
    const lineWeeks = JSON.parse(JSON.stringify(weeksData.slice(-41)));

    const playWheCarousel = renderCarouselWithCurrentPW(pwWeeks, containerId + '-pw');
    const lineChartCarousel = renderLineChartCarousel(lineWeeks, containerId + '-line');
    const shelfMarksHTML = renderShelfContainer(weeksData);

    return `
    <div style="background: #ffffff; border-radius: 12px; padding: 12px; border: 1px solid #dddddd; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin: 4px 0; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 48px; font-weight: 900; color: rgba(0,0,0,0.03); letter-spacing: 8px; pointer-events: none; white-space: nowrap; z-index: 0;">CODEWITHGLASGOW</div>
        
        <div id="unified-header-${containerId}" style="text-align: center; margin-bottom: 12px; position: relative; z-index: 1;">
            <div style="font-size: 18px; font-weight: 900; color: #000000; letter-spacing: 1px;">♠️ PLAY WHE DAY TO DAY CHART</div>
            <div style="font-size: 10px; color: #666666; margin-top: 2px;">${new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
        
        <div id="unified-carousel-content-${containerId}" style="position: relative; z-index: 1;">
            <div id="unified-carousel-pw-${containerId}" class="unified-carousel-panel" style="display: block;">${playWheCarousel}</div>
            <div id="unified-carousel-line-${containerId}" class="unified-carousel-panel" style="display: none;">${lineChartCarousel}</div>
            <div id="unified-carousel-shelf-${containerId}" class="unified-carousel-panel" style="display: none;">${shelfMarksHTML}</div>
        </div>
        <br>
        <div style="width:100%; height:2px; background:#000;"></div>

        <div style="display: flex; gap: 6px; margin-top: 12px; position: relative; z-index: 1; justify-content: center; flex-wrap: wrap;">
            <button class="unified-tab-btn-${containerId}" data-tab="pw" onclick="switchUnifiedTab_${containerId.replace(/-/g, '_')}('pw')" style="background: #000000; color: #ffffff; border: none; padding: 8px 14px; border-radius: 20px; font-weight: 800; font-size: 11px; cursor: pointer;">♦️PLAY WHE</button>
            <button class="unified-tab-btn-${containerId}" data-tab="line" onclick="switchUnifiedTab_${containerId.replace(/-/g, '_')}('line')" style="background: #e0e0e0; color: #666666; border: none; padding: 8px 8px; border-radius: 20px; font-weight: 800; font-size: 11px; cursor: pointer;">♦️LINE CHART</button>
            <button class="unified-tab-btn-${containerId}" data-tab="shelf" onclick="switchUnifiedTab_${containerId.replace(/-/g, '_')}('shelf')" style="background: #e0e0e0; color: #666666; border: none; padding: 8px 8px; border-radius: 20px; font-weight: 800; font-size: 11px; cursor: pointer;">♠️SHELF CHART</button>
        </div>
        
        <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #dddddd; text-align: center;">
            <span style="font-size: 7px; color: #666;">⚡ Day to Day Charts • Shelf Analysis • CodeWithGlasgow ©️ CWG Builds</span>
        </div>
        
        <script>
            window.switchUnifiedTab_${containerId.replace(/-/g, '_')} = function(tab) {
                var tabTitles = {
                    pw: '♠️ PLAY WHE DAY TO DAY CHART',
                    line: '♠️ PLAY WHE LINE CHART MAPPING',
                    shelf: '♠️ PLAY WHE STATS & SHELF MARKS'
                };
                
                var header = document.getElementById('unified-header-${containerId}');
                if (header) {
                    var titleDiv = header.querySelector('div');
                    if (titleDiv) titleDiv.textContent = tabTitles[tab];
                }
                
                document.querySelectorAll('.unified-tab-btn-${containerId}').forEach(function(btn) {
                    btn.style.background = '#e0e0e0';
                    btn.style.color = '#666666';
                });
                
                var activeBtn = document.querySelector('.unified-tab-btn-${containerId}[data-tab="' + tab + '"]');
                if (activeBtn) {
                    activeBtn.style.background = '#000000';
                    activeBtn.style.color = '#ffffff';
                }
                
                document.querySelectorAll('.unified-carousel-panel').forEach(function(panel) {
                    panel.style.display = panel.id === 'unified-carousel-' + tab + '-${containerId}' ? 'block' : 'none';
                });
            };
        </script>
    </div>
    `;
}

function renderLineChartCarousel(weeks, containerId) {
    if (!weeks || weeks.length === 0) return "";
    
    const previousWeeks = weeks.slice(0, -1);
    const currentWeek = weeks[weeks.length - 1];
    
    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const currentStartDate = formatDate(currentWeek.startDate);
    const currentEndDate = currentWeek.endDate ? formatDate(currentWeek.endDate) : (() => {
        const sDate = new Date(currentWeek.startDate);
        const eDate = new Date(sDate);
        eDate.setDate(sDate.getDate() + 6);
        return formatDate(eDate);
    })();

    const prevSlidesHtml = previousWeeks.reverse().map((wk, idx) => {
        const weekNum = previousWeeks.length - idx;
        const startLbl = formatDate(wk.startDate);
        const endLbl = wk.endDate ? formatDate(wk.endDate) : (() => {
            const sDate = new Date(wk.startDate);
            const eDate = new Date(sDate);
            eDate.setDate(sDate.getDate() + 6);
            return formatDate(eDate);
        })();

        let tableHtml = buildLineTable([wk]);
        tableHtml = tableHtml.replace(/<div class="carousel-table-header"><span>(CURRENT|PREVIOUS) WEEK<\/span><\/div>/, 
            `<div class="carousel-table-header"><span>⌛ WEEK ${weekNum}</span><span>${startLbl} - ${endLbl}</span></div>`);
            
        return `<div class="carousel-slide">${tableHtml}</div>`;
    }).join('');

    let currentTableHtml = buildLineTable([currentWeek]);
    currentTableHtml = currentTableHtml.replace(/<div class="carousel-table-header"><span>CURRENT WEEK<\/span><\/div>/, 
        `<div class="carousel-table-header carousel-current-header"><span>⚜️ CURRENT WEEK</span><span>${currentStartDate} - ${currentEndDate}</span><span>LIVE RESULTS</span></div>`);
    
    currentTableHtml = `<div class="carousel-current-section"><div class="carousel-current-label">⚜️ CURRENT WEEK ⚜️</div>${currentTableHtml}</div>`;
    
    const carouselHtml = previousWeeks.length > 0 ? `
    <div class="carousel-container" id="${containerId}-carousel" style="margin-bottom: 4px; padding: 4px 0;">
        <div class="carousel-track" id="${containerId}-track" style="gap: 12px;">${prevSlidesHtml}</div>
    </div>
    ` : '<div style="text-align:center;padding:20px;color:#64748b;">📅 No previous weeks available</div>';
    
    return carouselHtml + currentTableHtml;
}

// =====================================
// MISSING LINES & SUITES
// =====================================
function renderIntelligentAnalysis(weeks) {
  if (!weeks || weeks.length === 0) {
    return `<div style="background: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #dddddd; text-align:center; color:#999;">📊 No data available</div>`;
  }

  const sortedWeeks = [...weeks].sort((a, b) => {
    let pa = a.startDate.split(" ");
    let pb = b.startDate.split(" ");
    return new Date(pa[2] + "-" + pa[1] + "-" + pa[0]) - new Date(pb[2] + "-" + pb[1] + "-" + pb[0]);
  });

  const currentWeek = sortedWeeks[sortedWeeks.length - 1];
  let previousWeek = null;
  for (let i = sortedWeeks.length - 2; i >= 0; i--) {
    const week = sortedWeeks[i];
    let hasValidDraw = false;
    if (week && week.days) {
      for (const day of week.days) {
        if (day && day.draws) {
          for (const slot of ["MOR", "MID", "NON", "EVE"]) {
            const val = day.draws[slot];
            if (val && val !== "-" && val !== "PENDING" && val !== "HOLIDAY") { hasValidDraw = true; break; }
          }
        }
        if (hasValidDraw) break;
      }
    }
    if (hasValidDraw) { previousWeek = week; break; }
  }
  if (!previousWeek) previousWeek = currentWeek;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const slots = ["MOR", "MID", "NON", "EVE"];
  const now = new Date();

  const timeDisplay = { MOR: "10:30 AM", MID: "1:00 PM", NON: "4:00 PM", EVE: "7:00 PM" };

  function getDrawWithDate(week, dayName, slot) {
    if (!week) return null;
    const day = week.days.find(d => d.dayName === dayName);
    if (!day) return null;
    const val = day.draws[slot];
    if (val && val !== "-" && val !== "PENDING" && val !== "HOLIDAY") {
      const parts = week.startDate.split(" ");
      const monthMap = {"Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,"Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11};
      const startDate = new Date(parts[2], monthMap[parts[1]], parseInt(parts[0]));
      const dayIndex = dayNames.indexOf(dayName);
      const drawDate = new Date(startDate);
      drawDate.setDate(startDate.getDate() + dayIndex);
      return { value: parseInt(val, 10), date: drawDate, slot: slot };
    }
    return null;
  }

  const previousWeekDraws = [];
  for (let d = 0; d < dayNames.length; d++) {
    for (const slot of slots) {
      const result = getDrawWithDate(previousWeek, dayNames[d], slot);
      if (result) previousWeekDraws.push(result.value);
    }
  }

  const currentWeekDraws = [];
  const currentWeekDrawsWithDate = [];
  const todayIdx = now.getDay();
  for (let d = 0; d <= todayIdx; d++) {
    for (const slot of slots) {
      const result = getDrawWithDate(currentWeek, dayNames[d], slot);
      if (result) { currentWeekDraws.push(result.value); currentWeekDrawsWithDate.push(result); }
    }
  }

  const prevWeekCounts = {}, currWeekCounts = {};
  for (let i = 1; i <= 36; i++) { prevWeekCounts[i] = 0; currWeekCounts[i] = 0; }
  previousWeekDraws.forEach(num => { prevWeekCounts[num] = (prevWeekCounts[num] || 0) + 1; });
  currentWeekDraws.forEach(num => { currWeekCounts[num] = (currWeekCounts[num] || 0) + 1; });

  const doubleNumbers = [8, 11, 22, 33];
  const allDoubles = [], allTriples = [], allQuadruples = [];

  const toDoubleMissing = doubleNumbers.filter(num => !previousWeekDraws.includes(num) && !currentWeekDraws.includes(num));
  const toDoublePending = doubleNumbers.filter(num => (prevWeekCounts[num] || 0) === 1 && !currentWeekDraws.includes(num));
  const toDoubleCurrent = doubleNumbers.filter(num => (currWeekCounts[num] || 0) === 1);
  
  toDoubleMissing.forEach(num => allDoubles.push(num));
  toDoublePending.forEach(num => allDoubles.push(num));
  toDoubleCurrent.forEach(num => allDoubles.push(num));

  const toTriplePending = [], toTripleCurrent = [];
  for (let num = 1; num <= 36; num++) {
    if ((prevWeekCounts[num] || 0) === 2 && (currWeekCounts[num] || 0) === 0) toTriplePending.push(num);
    if ((currWeekCounts[num] || 0) === 2) toTripleCurrent.push(num);
  }
  toTriplePending.forEach(num => allTriples.push(num));
  toTripleCurrent.forEach(num => allTriples.push(num));

  const toQuadruplePending = [], toQuadrupleCurrent = [];
  for (let num = 1; num <= 36; num++) {
    if ((prevWeekCounts[num] || 0) === 3 && (currWeekCounts[num] || 0) === 0) toQuadruplePending.push(num);
    if ((currWeekCounts[num] || 0) === 3) toQuadrupleCurrent.push(num);
  }
  toQuadruplePending.forEach(num => allQuadruples.push(num));
  toQuadrupleCurrent.forEach(num => allQuadruples.push(num));

  const uniqueDoubles = [...new Set(allDoubles)].sort((a, b) => a - b);
  const uniqueTriples = [...new Set(allTriples)].sort((a, b) => a - b);
  const uniqueQuadruples = [...new Set(allQuadruples)].sort((a, b) => a - b);

  const completedDoubles = [], completedTriples = [], completedQuadruples = [];
  doubleNumbers.forEach(num => { if ((currWeekCounts[num] || 0) >= 2) completedDoubles.push(num); });
  for (let num = 1; num <= 36; num++) {
    if ((prevWeekCounts[num] || 0) === 2 && (currWeekCounts[num] || 0) === 1) completedTriples.push(num);
    if ((prevWeekCounts[num] || 0) === 3 && (currWeekCounts[num] || 0) === 1) completedQuadruples.push(num);
  }

  const finalDoubles = uniqueDoubles.filter(num => !completedDoubles.includes(num));
  const finalTriples = uniqueTriples.filter(num => !completedTriples.includes(num));
  const finalQuadruples = uniqueQuadruples.filter(num => !completedQuadruples.includes(num));

  const spiritEmoji = {1:"🔪",2:"👵🏾",3:"🚕",4:"⚰️",5:"👨🏾‍🦳",6:"🤰🏽",7:"🐗",8:"🐯",9:"🐮",10:"🐒",11:"🦅",12:"🤴🏽",13:"🐸",14:"💰",15:"🤧",16:"💃🏽",17:"🐦‍⬛",18:"🚤",19:"🐎",20:"🐶",21:"👄",22:"🐀",23:"🏡",24:"🫅🏽",25:"🐢",26:"🐔",27:"🐍",28:"🐟",29:"🍻",30:"🐈‍⬛",31:"👵🏾",32:"🦐",33:"🕷️",34:"👨🏾‍🦯",35:"🐍",36:"🫏"};
  const spiritNames = {1:"Centipede",2:"Old Lady",3:"Carriage",4:"Dead Man",5:"Parson Man",6:"Belly",7:"Hog",8:"Tiger",9:"Cattle",10:"Monkey",11:"Corbeau",12:"King",13:"Crapaud",14:"Money",15:"Sick Woman",16:"Jamette",17:"Pigeon",18:"Water Boat",19:"Horse",20:"Dog",21:"Mouth",22:"Rat",23:"House",24:"Queen",25:"Morrocoy",26:"Fowl",27:"Little Snake",28:"Red Fish",29:"Opium Man",30:"House Cat",31:"Parson Wife",32:"Shrimp",33:"Spider",34:"Blind Man",35:"Big Snake",36:"Donkey"};

  const completionDetails = {};
  currentWeekDrawsWithDate.forEach(draw => {
    const key = `${draw.value}`;
    if (!completionDetails[key]) completionDetails[key] = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateStr = `${days[draw.date.getDay()]} ${draw.date.getDate()} ${months[draw.date.getMonth()]} '${draw.date.getFullYear().toString().slice(-2)}`;
    completionDetails[key].push({ formatted: `${dateStr} @ ${timeDisplay[draw.slot] || draw.slot}` });
  });

  const allBanners = [];
  completedQuadruples.forEach(num => {
    const draws = completionDetails[num] || [];
    const dateStr = draws.length > 0 ? ` ${draws[draws.length - 1].formatted}` : "";
    allBanners.push({ num, color: '#ff375f', priority: 4, text: `#${num}${spiritEmoji[num]} (${spiritNames[num]}) Has Completed <span style="color:#ff375f;">QUADRUPLE</span>!<br><center>${dateStr}</center>` });
  });
  toQuadruplePending.forEach(num => {
    allBanners.push({ num, color: '#800080', priority: 3, text: `#${num}${spiritEmoji[num]} (${spiritNames[num]}) Made 3 Hits - 1 More To QUADRUPLE!<br><center>Pending from last week</center>` });
  });
  toQuadrupleCurrent.forEach(num => {
    const draws = completionDetails[num] || [];
    const dateStr = draws.length > 0 ? ` ${draws[draws.length - 1].formatted}` : "";
    allBanners.push({ num, color: '#ff375f', priority: 2, text: `#${num}${spiritEmoji[num]} (${spiritNames[num]}) Made <span style="color:#ff375f;">3 HITS</span> - 1 More To QUADRUPLE!<br><center>${dateStr}</center>` });
  });
  completedTriples.forEach(num => {
    const draws = completionDetails[num] || [];
    const dateStr = draws.length > 0 ? ` ${draws[draws.length - 1].formatted}` : "";
    allBanners.push({ num, color: '#ff9d00', priority: 1, text: `#${num}${spiritEmoji[num]} (${spiritNames[num]}) Has Completed <span style="color:#ff9d00;">TRIPLE</span>!<br><center>${dateStr}</center>` });
  });
  toTriplePending.forEach(num => {
    allBanners.push({ num, color: '#800080', priority: 0, text: `#${num}${spiritEmoji[num]} (${spiritNames[num]}) Made 2 Hits - 1 More To TRIPLE!<br><center>Pending from last week</center>` });
  });
  toTripleCurrent.forEach(num => {
    const draws = completionDetails[num] || [];
    const dateStr = draws.length > 0 ? ` ${draws[draws.length - 1].formatted}` : "";
    allBanners.push({ num, color: '#ff9d00', priority: 0, text: `#${num}${spiritEmoji[num]} (${spiritNames[num]}) Made <span style="color:#ff9d00;">2 HITS</span> - 1 More To TRIPLE!<br><center>${dateStr}</center>` });
  });
  doubleNumbers.forEach(num => {
    if ((currWeekCounts[num] || 0) >= 2) {
      const draws = completionDetails[num] || [];
      const dateStr = draws.length > 0 ? ` ${draws[draws.length - 1].formatted}` : "";
      allBanners.push({ num, color: '#32d74b', priority: 0, text: `#${num}${spiritEmoji[num]} (${spiritNames[num]}) Has Completed <span style="color:#32d74b;">DOUBLE</span>!<br><center>${dateStr}</center>` });
    }
  });
  toDoublePending.forEach(num => {
    allBanners.push({ num, color: '#800080', priority: 0, text: `Double: #${num}${spiritEmoji[num]} (${spiritNames[num]}) <span style="color:#800080;">PENDING</span> - 1 More To DOUBLE!<br><center>Pending from last week</center>` });
  });
  toDoubleCurrent.forEach(num => {
    const draws = completionDetails[num] || [];
    const dateStr = draws.length > 0 ? ` ${draws[draws.length - 1].formatted}` : "";
    allBanners.push({ num, color: '#32d74b', priority: 0, text: `Double: #${num}${spiritEmoji[num]} (${spiritNames[num]}) Made <span style="color:#32d74b;">1 HIT</span> - 1 More To DOUBLE!<br><center>${dateStr}</center>` });
  });

  allBanners.sort((a, b) => b.priority - a.priority);

  let completionBannerHtml = '';
  if (allBanners.length > 0) {
    const bannerItems = allBanners.map((banner, index) => `
      <div class="banner-item" style="display: ${index === 0 ? 'flex' : 'none'}; justify-content: center; align-items: center; gap: 6px; background: ${banner.color}20; padding: 4px 12px; border-radius: 8px; border: 1px solid ${banner.color}; width: 100%;">
        <span style="font-size: 10px; font-weight: 700; color: ${banner.color};">🔔</span>
        <span style="font-size: 10px; font-weight: 700; color: #000000;">${banner.text}</span>
      </div>
    `).join('');

    const bannerId = 'banner-' + Date.now();
    completionBannerHtml = `
      <div id="${bannerId}" style="display: flex; justify-content: center; align-items: center; min-height: 32px; margin-bottom: 3px; width: 100%;">
        ${bannerItems}
      </div>
      <script>
        (function() {
          const container = document.getElementById('${bannerId}');
          if (!container) return;
          const items = container.querySelectorAll('.banner-item');
          if (items.length <= 1) return;
          let currentIndex = 0;
          setInterval(function() {
            items[currentIndex].style.display = 'none';
            currentIndex = (currentIndex + 1) % items.length;
            items[currentIndex].style.display = 'flex';
          }, 4000);
        })();
      </script>
    `;
  }

  function renderCategoryGrid(numbers, categoryColor, isDouble = false, isTriple = false, isQuadruple = false) {
    if (!numbers || numbers.length === 0) {
      return `<div style="text-align:center; color:#999; font-size:11px; padding:8px 0;">None</div>`;
    }
    
    const displayNumbers = numbers.slice(0, 9);
    
    return `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px;">
        ${displayNumbers.map(num => {
          const isMissing = isDouble && !previousWeekDraws.includes(num) && !currentWeekDraws.includes(num);
          const isPending = (isDouble && (prevWeekCounts[num] || 0) === 1 && !currentWeekDraws.includes(num)) ||
                           (isTriple && (prevWeekCounts[num] || 0) === 2 && !currentWeekDraws.includes(num)) ||
                           (isQuadruple && (prevWeekCounts[num] || 0) === 3 && !currentWeekDraws.includes(num));
          const isOneHit = isDouble && (currWeekCounts[num] || 0) === 1;
          const isTwoHit = isTriple && (currWeekCounts[num] || 0) === 2;
          const isThreeHit = isQuadruple && (currWeekCounts[num] || 0) === 3;
          
          let bgColor = `${categoryColor}15`, textColor = categoryColor, borderColor = `${categoryColor}30`;
          
          if (isMissing) { bgColor = '#ffffff'; textColor = '#000000'; borderColor = '#cccccc'; }
          else if (isPending) { bgColor = 'rgba(128, 0, 128, 0.15)'; textColor = '#800080'; borderColor = 'rgba(128, 0, 128, 0.4)'; }
          else if (isOneHit) { bgColor = '#32d74b'; textColor = '#000000'; borderColor = '#32d74b'; }
          else if (isTwoHit) { bgColor = 'rgba(255, 165, 0, 0.25)'; textColor = '#ff8c00'; borderColor = 'rgba(255, 165, 0, 0.4)'; }
          else if (isThreeHit) { bgColor = 'rgba(255, 55, 95, 0.25)'; textColor = '#ff375f'; borderColor = 'rgba(255, 55, 95, 0.4)'; }
          
          return `
            <div style="display: flex; flex-direction: column; align-items: center; background: ${bgColor}; border-radius: 4px; padding: 4px 2px; border: 1px solid ${borderColor};">
              <span style="font-size: 16px; font-weight: 900; color: ${textColor};">${num}</span>
              <span style="font-size: 11px; color: #666;">${spiritEmoji[num] || ''}</span>
            </div>
          `;
        }).join('')}
        ${displayNumbers.length < 9 ? Array(9 - displayNumbers.length).fill(0).map(() => `
          <div style="display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.02); border-radius: 4px; padding: 4px 2px; opacity: 0.3;">
            <span style="font-size: 16px; font-weight: 900; color: #ccc;">—</span>
          </div>
        `).join('') : ''}
      </div>
    `;
  }

  function getDateRange() {
    if (!weeks || weeks.length === 0) return "Loading...";
    const sorted = [...weeks].sort((a, b) => {
      let pa = a.startDate.split(" ");
      let pb = b.startDate.split(" ");
      return new Date(pa[2] + "-" + pa[1] + "-" + pa[0]) - new Date(pb[2] + "-" + pb[1] + "-" + pb[0]);
    });
    const lastTwo = sorted.slice(-2);
    if (lastTwo.length === 0) return "No data";
    const startDate = new Date(lastTwo[0].startDate);
    const endDate = new Date(lastTwo[lastTwo.length - 1].startDate);
    endDate.setDate(endDate.getDate() + 6);
    const formatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString('en-US', formatOptions)}`;
  }

  const windowDraws = [];
  weeks.slice(-2).forEach(wk =>
    wk.days.forEach(d =>
      slots.forEach(t => {
        let val = String(d.draws[t]);
        if (val.match(/^\d+/) && val !== "PENDING") windowDraws.push(parseInt(val));
      })
    )
  );

  const lines = {1:[1,10,19,28], 2:[2,11,20,29], 3:[3,12,21,30], 4:[4,13,22,31], 5:[5,14,23,32], 6:[6,15,24,33], 7:[7,16,25,34], 8:[8,17,26,35], 9:[9,18,27,36]};
  const suites = {0:[10,20,30], 1:[1,11,21,31], 2:[2,12,22,32], 3:[3,13,23,33], 4:[4,14,24,34], 5:[5,15,25,35], 6:[6,16,26,36], 7:[7,17,27], 8:[8,18,28], 9:[9,19,29]};

  function renderGroup(group, labelPrefix) {
    return Object.keys(group).map(k => {
      const nums = group[k];
      const missingNums = [];
      const numsHtml = nums.map(n => {
        const appeared = windowDraws.includes(n);
        if (!appeared) missingNums.push(n);
        return `<span style="${appeared ? 'color:#888; text-decoration:line-through; opacity:0.4;' : 'color:#ff9d00; font-weight:900;'} margin-right:6px;">${n}</span>`;
      }).join("");
      const missingText = missingNums.length > 0 ? `• ${missingNums.join(", ")} to complete ${k} ${labelPrefix}` : `• ${k} ${labelPrefix} Complete`;
      return `<div style="margin-bottom:6px;"><b>${k} ${labelPrefix} :</b> ${numsHtml} ${missingText}</div>`;
    }).join("");
  }

  const lineHtml = renderGroup(lines, "LINE");
  const suiteHtml = renderGroup(suites, "SUITE");
  const dateRange = getDateRange();

  return `
    <div style="background: #ffffff; border-radius: 12px; padding: 12px; border: 1px solid #dddddd; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 3px;">
        <div style="font-size: 14px; font-weight: 900; color: #000000;">⚜️♨️ STREAK PLAY INSIGHT ♨️⚜️</div>
        <div style="font-size: 10px; font-weight: 700; color: #666;">📅 ${dateRange}</div>
      </div>
      
      ${completionBannerHtml}
      
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 3px;">
        <div style="background: rgba(50, 215, 75, 0.05); border-radius: 8px; padding: 6px 8px; border: 1px solid rgba(50, 215, 75, 0.2);">
          <div style="text-align: center; margin-bottom: 3px;">
            <span style="font-size: 10px; font-weight: 800; color: #32d74b;">🔥DOUBLE🔥</span>
            <span style="font-size: 7px; color: #666; display: block;">1x → 2x</span>
          </div>
          ${renderCategoryGrid(finalDoubles, '#32d74b', true, false, false)}
          ${finalDoubles.length > 0 ? `<div style="text-align: center; font-size: 7px; color: #666; margin-top: 3px;">${finalDoubles.length} numbers</div>` : ''}
        </div>
        <div style="background: rgba(255, 157, 0, 0.05); border-radius: 8px; padding: 6px 8px; border: 1px solid rgba(255, 157, 0, 0.2);">
          <div style="text-align: center; margin-bottom: 3px;">
            <span style="font-size: 10px; font-weight: 800; color: #ff9d00;">♠️TRIPLE♠️</span>
            <span style="font-size: 7px; color: #666; display: block;">2x → 3x</span>
          </div>
          ${renderCategoryGrid(finalTriples, '#ff9d00', false, true, false)}
          ${finalTriples.length > 0 ? `<div style="text-align: center; font-size: 7px; color: #666; margin-top: 3px;">${finalTriples.length} numbers</div>` : ''}
        </div>
        <div style="background: rgba(255, 55, 95, 0.05); border-radius: 8px; padding: 6px 8px; border: 1px solid rgba(255, 55, 95, 0.2);">
          <div style="text-align: center; margin-bottom: 3px;">
            <span style="font-size: 10px; font-weight: 800; color: #ff375f;">♦️QUADRUPLE♦️</span>
            <span style="font-size: 7px; color: #666; display: block;">3x → 4x</span>
          </div>
          ${renderCategoryGrid(finalQuadruples, '#ff375f', false, false, true)}
          ${finalQuadruples.length > 0 ? `<div style="text-align: center; font-size: 7px; color: #666; margin-top: 3px;">${finalQuadruples.length} numbers</div>` : ''}
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin: 4px 0 8px 0; padding: 6px; background: #f5f5f5; border-radius: 4px;">
        <div style="display: flex; align-items: center; gap: 6px; font-size: 8px; color: #666; padding: 2px 4px;">
          <span style="display: inline-block; width: 14px; height: 14px; background: #ffffff; border: 1px solid #cccccc; border-radius: 3px; flex-shrink: 0;"></span>
          <span>MISSING = 0 HITS</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 8px; color: #666; padding: 2px 4px;">
          <span style="display: inline-block; width: 14px; height: 14px; background: #800080; border-radius: 3px; flex-shrink: 0;"></span>
          <span>PENDING = From last week</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 8px; color: #666; padding: 2px 4px;">
          <span style="display: inline-block; width: 14px; height: 14px; background: #32d74b; border-radius: 3px; flex-shrink: 0;"></span>
          <span>1 HIT = Needs 1 more</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 8px; color: #666; padding: 2px 4px;">
          <span style="display: inline-block; width: 14px; height: 14px; background: #ff8c00; border-radius: 3px; flex-shrink: 0;"></span>
          <span>2 HITS = Needs 1 more</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 8px; color: #666; padding: 2px 4px;">
          <span style="display: inline-block; width: 14px; height: 14px; background: #ff375f; border-radius: 3px; flex-shrink: 0;"></span>
          <span>3 HITS = Needs 1 more</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 8px; color: #666; padding: 2px 4px;">
          <span style="display: inline-block; width: 14px; height: 14px; background: #32d74b; border: 2px solid #32d74b; border-radius: 3px; flex-shrink: 0;"></span>
          <span>COMPLETED</span>
        </div>
      </div>
      
      <hr style="border: none; border-top: 2px solid #000000; margin: 6px 0 8px 0;">
    
      <div style="text-align: center; margin-bottom: 3px;">
        <div style="font-size: 14px; font-weight: 900; color: #000000;">♠️ MISSING LINES & SUITES CHART ♠️</div>
        <div style="font-size: 10px; font-weight: 700; color: #666;">📅 ${dateRange}</div>
      </div>
      
      <div style="padding: 4px 8px; font-size: 13px;">
        ${lineHtml}
        <hr style="border: none; border-top: 1px solid #dddddd; margin: 3px 0;">
        ${suiteHtml}
      </div>
      
      <div style="margin-top: 3px; padding-top: 6px; border-top: 1px solid #dddddd; display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap;">
        <span style="font-size: 8px; color: #666;">⚡ Missing Lines & Suites Chart • CodeWithGlasgow ©️ CWG Builds</span>
      </div>
    </div>
  `;
}

// =====================================
// WHEWHE MARK & ANALYSIS
// =====================================
function renderWheWheMarkAnalysis(weeksData) {
    if (!weeksData || weeksData.length === 0) {
        return '<div style="background: #ffffff; border-radius: 10px; padding: 16px; border: 1px solid #dddddd; margin: 8px 0; text-align:center; color:#999;">📊 No data available for analysis</div>';
    }

    const { marks, intervals, numberColors } = processShelfData(weeksData);

    const lines = {
        1: [1,10,19,28], 2: [2,11,20,29], 3: [3,12,21,30],
        4: [4,13,22,31], 5: [5,14,23,32], 6: [6,15,24,33],
        7: [7,16,25,34], 8: [8,17,26,35], 9: [9,18,27,36]
    };

    const suites = {
        0: [10,20,30], 1: [1,11,21,31], 2: [2,12,22,32],
        3: [3,13,23,33], 4: [4,14,24,34], 5: [5,15,25,35],
        6: [6,16,26,36], 7: [7,17,27], 8: [8,18,28], 9: [9,19,29]
    };

    const markMap = {};
    marks.forEach(m => { markMap[m.num] = m; });

    const containerId = 'whewhe-' + Date.now();
    const safeId = containerId.replace(/-/g, '_');

    let html = '';
    html += '<div style="background: #ffffff; border-radius: 10px; padding: 12px; border: 1px solid #dddddd; margin: 6px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">';
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">';
    html += '<div style="display: flex; align-items: center; gap: 8px;">';
    html += '<span style="font-size: 14px; font-weight: 900; color: #000000;">🔍 WheWhe Mark & Analysis</span>';
    html += '<span style="font-size: 8px; color: #999; background: #f5f5f5; padding: 2px 8px; border-radius: 10px;">Enter 1-4 marks</span>';
    html += '</div>';
    html += '<button onclick="clearWheWheSearch_' + safeId + '()" style="background: none; border: none; color: #999; font-size: 12px; cursor: pointer; padding: 4px 8px; display: none;" id="clearBtn-' + containerId + '">✕ Clear</button>';
    html += '</div>';
    html += '<div style="display: flex; gap: 6px; margin-bottom: 8px;">';
    html += '<input type="text" id="whewheInput-' + containerId + '" placeholder="e.g., 4, 12, 16, 29" style="flex: 1; padding: 8px 12px; border: 2px solid #dddddd; border-radius: 8px; font-size: 13px; font-weight: 600; color: #000; outline: none;">';
    html += '<button onclick="runWheWheSearch_' + safeId + '()" style="background: #000000; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer;">Search</button>';
    html += '</div>';
    html += '<div id="whewheResults-' + containerId + '" style="display: none; margin-top: 6px; overflow-x: auto;">';
    html += '<table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden;">';
    html += '<thead><tr style="background: #f5f5f5; border-bottom: 2px solid #000000;">';
    html += '<th style="padding: 6px 8px; text-align: center; font-weight: 800; color: #000; font-size: 10px;">MARK</th>';
    html += '<th style="padding: 6px 8px; text-align: center; font-weight: 800; color: #000; font-size: 10px;">NAME</th>';
    html += '<th style="padding: 6px 8px; text-align: center; font-weight: 800; color: #000; font-size: 10px;">STATUS</th>';
    html += '<th style="padding: 6px 8px; text-align: center; font-weight: 800; color: #000; font-size: 10px;">LAST</th>';
    html += '<th style="padding: 6px 8px; text-align: center; font-weight: 800; color: #000; font-size: 10px;">HITS</th>';
    html += '<th style="padding: 6px 8px; text-align: center; font-weight: 800; color: #000; font-size: 10px;">BEST</th>';
    html += '<th style="padding: 6px 8px; text-align: center; font-weight: 800; color: #000; font-size: 10px;">L/S</th>';
    html += '</tr></thead>';
    html += '<tbody id="whewheTableBody-' + containerId + '"></tbody>';
    html += '</table>';
    html += '<div style="padding: 8px; font-size: 8px; color: #999; text-align: center; border-top: 1px solid #eeeeee;">⚡ Analysis based on historical data • CodeWithGlasgow ©️ CWG</div>';
    html += '</div>';
    html += '<div id="whewheNoResults-' + containerId + '" style="display: none; padding: 20px; text-align: center; color: #999; font-size: 12px;"></div>';
    html += '<style>';
    html += '.status-badge { display: inline-block; padding: 2px 5px; border-radius: 12px; font-size: 9px; font-weight: 800; }';
    html += '.status-badge.due { background: #ff453a; color: #ffffff; }';
    html += '.status-badge.warm { background: #ff9f0a; color: #000000; }';
    html += '.status-badge.monitor { background: #32d74b; color: #000000; }';
    html += '.status-badge.unknown { background: #e0e0e0; color: #666666; }';
    html += '.analysis-ball { display: inline-block; width: 22px; height: 22px; border-radius: 50%; text-align: center; line-height: 22px; font-weight: 900; font-size: 14px; color: #000; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }';
    html += '</style>';
    html += '</div>';

    html += '<script>';
    html += '(function() {';
    html += 'const containerId = "' + containerId + '";';
    html += 'const input = document.getElementById("whewheInput-" + containerId);';
    html += 'const resultsDiv = document.getElementById("whewheResults-" + containerId);';
    html += 'const noResultsDiv = document.getElementById("whewheNoResults-" + containerId);';
    html += 'const clearBtn = document.getElementById("clearBtn-" + containerId);';
    html += 'const tableBody = document.getElementById("whewheTableBody-" + containerId);';
    html += 'const markData = ' + JSON.stringify(markMap) + ';';
    html += 'const intervals = ' + JSON.stringify(intervals) + ';';
    html += 'const numberColors = ' + JSON.stringify(numberColors) + ';';
    html += 'const spirits = ' + JSON.stringify({1:"Centipede",2:"Old Lady",3:"Carriage",4:"Dead Man",5:"Parson Man",6:"Belly",7:"Hog",8:"Tiger",9:"Cattle",10:"Monkey",11:"Corbeau",12:"King",13:"Crapaud",14:"Money",15:"Sick Woman",16:"Jamette",17:"Pigeon",18:"Water Boat",19:"Horse",20:"Dog",21:"Mouth",22:"Rat",23:"House",24:"Queen",25:"Morrocoy",26:"Fowl",27:"Little Snake",28:"Red Fish",29:"Opium Man",30:"House Cat",31:"Parson Wife",32:"Shrimp",33:"Spider",34:"Blind Man",35:"Big Snake",36:"Donkey"}) + ';';
    html += 'const lines = ' + JSON.stringify(lines) + ';';
    html += 'const suites = ' + JSON.stringify(suites) + ';';
    html += `
    function getLineSuite(num) {
        let line = null, suite = null;
        for (let [key, group] of Object.entries(lines)) { if (group.includes(num)) { line = key; break; } }
        for (let [key, group] of Object.entries(suites)) { if (group.includes(num)) { suite = key; break; } }
        let parts = [];
        if (line !== null) parts.push(line + 'L');
        if (suite !== null) parts.push(suite + 'S');
        return parts.join('/') || '—';
    }
    
    function getMostPlayedTime(num) {
        const info = markData[num];
        if (!info || !info.time || info.time === "N/A") return "—";
        return info.time;
    }
    
    function getStatus(num) {
        const info = markData[num];
        if (!info) return { label: 'UNKNOWN', class: 'unknown' };
        const avg = intervals[num] || 12;
        if (info.days > avg) return { label: '🔥 DUE', class: 'due' };
        if (info.days > (avg * 0.75)) return { label: '♨️ WARM', class: 'warm' };
        return { label: '✅ 👀', class: 'monitor' };
    }
    
    function getColor(num) {
        const key = String(num).padStart(2, '0');
        return numberColors[key] || '#cccccc';
    }
    
    window.runWheWheSearch_${safeId} = function() {
        const val = input.value.trim();
        if (!val) {
            resultsDiv.style.display = 'none';
            noResultsDiv.style.display = 'none';
            clearBtn.style.display = 'none';
            return;
        }
        
        const numbers = val.split(/[,\\s]+/).map(function(n) { return parseInt(n.trim()); }).filter(function(n) { return !isNaN(n) && n >= 1 && n <= 36; });
        const uniqueNumbers = [...new Set(numbers)];
        
        if (uniqueNumbers.length === 0 || uniqueNumbers.length > 4) {
            noResultsDiv.style.display = 'block';
            noResultsDiv.innerHTML = '⚠️ Please enter 1-4 valid numbers (1-36)';
            resultsDiv.style.display = 'none';
            clearBtn.style.display = 'block';
            return;
        }
        
        let rowsHtml = '';
        uniqueNumbers.forEach(function(num) {
            const info = markData[num] || { days: 999, frequency: 0, date: 'Never' };
            const status = getStatus(num);
            const color = getColor(num);
            const spirit = spirits[num] || 'Unknown';
            const lineSuite = getLineSuite(num);
            const mostPlayed = getMostPlayedTime(num);
            const lastPlayed = info.date || 'Never';
            
            rowsHtml += '<tr style="border-bottom: 1px solid #eeeeee;">';
            rowsHtml += '<td style="padding: 6px 8px; text-align: center;"><span class="analysis-ball" style="background: ' + color + ';">' + num + '</span></td>';
            rowsHtml += '<td style="padding: 6px 8px; text-align: center; font-weight: 600; font-size: 8px;">' + spirit + '</td>';
            rowsHtml += '<td style="padding: 6px 8px; text-align: center;"><span class="status-badge ' + status.class + '">' + status.label + '</span></td>';
            rowsHtml += '<td style="padding: 6px 8px; text-align: center; font-size: 8px;">' + lastPlayed + '</td>';
            rowsHtml += '<td style="padding: 6px 8px; text-align: center; font-weight: 700; color: #32d74b;">' + (info.frequency || 0) + 'x</td>';
            rowsHtml += '<td style="padding: 6px 8px; text-align: center; font-size: 8px; font-weight: 600;">' + mostPlayed + '</td>';
            rowsHtml += '<td style="padding: 6px 8px; text-align: center; font-size: 8px; font-weight: 600; color: #007AFF;">' + lineSuite + '</td>';
            rowsHtml += '</tr>';
        });
        
        tableBody.innerHTML = rowsHtml;
        resultsDiv.style.display = 'block';
        noResultsDiv.style.display = 'none';
        clearBtn.style.display = 'block';
    };
    
    window.clearWheWheSearch_${safeId} = function() {
        input.value = '';
        resultsDiv.style.display = 'none';
        noResultsDiv.style.display = 'none';
        clearBtn.style.display = 'none';
    };
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') window.runWheWheSearch_${safeId}();
    });
    `;
    html += '})();';
    html += '</script>';
    
    return html;
}

// ====================================
// FULL SCREEN CHART WITH YEAR NAV
// ====================================
function generateFullScreenChart(allWeeks, gameType, title, pwData) {
    const isPlayWhe = (gameType === "P2WHE");
    
    const availableYears = getAvailableYears(allWeeks);
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Build views: CURRENT year first, then historical years
    const views = [];
    views.push({ key: "current", label: String(currentYear), isLive: true });
    availableYears.forEach(yr => views.push({ key: String(yr), label: String(yr), isLive: false }));
    
    const defaultView = "current";
    
    // *** COMPUTE LEAVING/MEETING ONCE FROM CURRENT LIVE WEEKS ***
    const liveWeeks = getYearFilteredWeeks(allWeeks, "current");
    const liveLM = calculateLeavingMeeting(liveWeeks, true);
    
    let viewContainersHTML = "";
    
    views.forEach(view => {
        const yearParam = view.isLive ? "current" : parseInt(view.key, 10);
        let viewWeeks = getYearFilteredWeeks(allWeeks, yearParam);
        
        if (!viewWeeks || viewWeeks.length === 0) {
            if (view.isLive) viewWeeks = getYearFilteredWeeks(allWeeks, "current");
            else viewWeeks = [];
        }
        
        const isActive = view.key === defaultView;
        
        // Build the year buttons HTML for THIS view (buttons shown below the table)
        const yearButtonsHTML = views.map(v => {
            const btnActive = v.key === view.key;
            return `<button 
                class="year-nav-btn" 
                data-year="${v.key}"
                onclick="switchYearView('${v.key}')"
                style="
                    background: ${btnActive ? '#000000' : '#e0e0e0'};
                    color: ${btnActive ? '#ffffff' : '#666666'};
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 800;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 60px;
                    touch-action: manipulation;
                    flex-shrink: 0;
                ">${v.label}</button>`;
        }).join("");
        
        // *** PASS LIVE LEAVING/MEETING TO EVERY VIEW ***
        const yearViewHTML = renderYearView(viewWeeks, allWeeks, view, isPlayWhe, title, view.key, yearButtonsHTML, liveLM);
        
        viewContainersHTML += `<div class="year-view" id="year-view-${view.key}" style="display: ${isActive ? 'block' : 'none'};">${yearViewHTML}</div>`;
    });
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                background: #ffffff;
                color: #000000;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                padding: 6px;
                min-height: 100vh;
            }
            .chart-container {
                max-width: 100%;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 6px;
                padding: 8px;
                border: 1px solid #dddddd;
                position: relative;
                overflow: hidden;
            }
            .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-30deg);
                font-size: 28px;
                font-weight: 900;
                color: rgba(0,0,0,0.04);
                letter-spacing: 9px;
                pointer-events: none;
                white-space: nowrap;
                z-index: 1;
            }
            .chart-header {
                text-align: center;
                margin-bottom: 2px;
                position: relative;
                z-index: 2;
            }
            .chart-header h1 {
                font-size: 16px;
                color: #000000;
                font-weight: 900;
                letter-spacing: 1px;
            }
            
            .lm-container {
                display: flex;
                justify-content: center;
                align-items: stretch;
                gap: 12px;
                margin: 4px 0 4px 0;
                position: relative;
                z-index: 2;
                padding: 0 2px;
            }
            .lm-box {
                flex: 1;
                max-width: 160px;
                border-radius: 8px;
                padding: 6px 8px;
                text-align: center;
                border: 1px solid #dddddd;
                background: #fafafa;
            }
            .lm-box .label {
                font-size: 8px;
                font-weight: 800;
                color: #666666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .lm-box .number { font-size: 22px; font-weight: 900; margin: 2px 0; }
            .lm-box .date { font-size: 8px; color: #666666; }
            .lm-box.leaving { border-color: #00f2ff; background: rgba(0, 242, 255, 0.08); }
            .lm-box.leaving .number { color: #00aacc; }
            .lm-box.meeting { border-color: #ff9d00; background: rgba(255, 157, 0, 0.08); }
            .lm-box.meeting .number { color: #cc7d00; }
            
            .table-wrap {
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                position: relative;
                z-index: 2;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 8px;
                table-layout: fixed;
            }
            th {
                padding: 3px 1px;
                color: #000000;
                font-weight: 800;
                font-size: 8px;
                border: 1px solid #cccccc;
                text-align: center;
                background: #f5f5f5;
                width: 10%;
            }
            th.day-border, td.day-border {
                border-left: 3px solid #000000 !important;
            }
            td {
                padding: 3px 1px;
                border: 1px solid #cccccc;
                text-align: center;
                font-weight: 700;
                font-size: 11px;
                color: #000000;
                background: #ffffff;
                width: 10%;
            }
            td.week-label {
                color: #000000;
                font-weight: 700;
                font-size: 9px;
                background: #f0f0f0;
                padding: 3px 1px;
                width: 8%;
            }
            td.holiday {
                color: #ff0000;
                font-weight: bold;
                font-size: 9px;
                background: #fff5f5;
                text-align: center;
            }
            td.leaving-highlight {
                background: #00f2ff !important;
                color: #000000 !important;
                font-weight: 900 !important;
            }
            td.meeting-highlight {
                background: #ff9d00 !important;
                color: #000000 !important;
                font-weight: 900 !important;
            }
            .row-odd td { background: #fafafa; }
            .row-even td { background: #ffffff; }
            .row-odd td.week-label { background: #f0f0f0; }
            .row-even td.week-label { background: #f0f0f0; }
            .row-current td { background: #e8f5e9; }
            .row-current td.week-label { background: #07f01b; }
            
            .footer {
                margin-top: 6px;
                padding-top: 6px;
                border-top: 1px solid #dddddd;
                display: flex;
                justify-content: space-between;
                font-size: 7px;
                color: #666666;
                position: relative;
                z-index: 2;
            }
            
            @media (max-width: 480px) {
                table { font-size: 7px; }
                td { padding: 2px 0px; font-size: 8px; }
                th { font-size: 6px; padding: 2px 0px; }
                td.week-label { font-size: 6px; padding: 2px 0px; }
                .chart-header h1 { font-size: 13px; }
                .watermark { font-size: 18px; }
                th.day-border, td.day-border { border-left: 2px solid #000000 !important; }
                .lm-box .number { font-size: 18px; }
                .lm-box { padding: 4px 6px; }
            }

            .carousel-container {
                margin-bottom: -21px;
                background: transparent;
                border-radius: 6px;
                padding: 4px 4px;
            }

            .carousel-track {
                overflow-x: scroll;
                scroll-snap-type: x mandatory;
                scroll-behavior: smooth;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;
                display: flex;
                gap: 7px;
                padding: 2px 2px;
            }

            .carousel-track::-webkit-scrollbar { display: none; }

            .carousel-slide {
                scroll-snap-align: start;
                flex: 0 0 100%;
                min-width: 0;
            }

            .carousel-current-section {
                margin-top: -7px;
                border-top: 1px solid rgba(255,157,0,0.3);
                padding-top: 0px;
            }

            .carousel-current-label {
                font-size: 14px;
                font-weight: bold;
                color: #000000;
                text-align: center;
                margin-bottom: 4px;
                letter-spacing: 2px;
            }

            .carousel-table-wrapper {
                margin-bottom: -10px;
                border-radius: 20px;
                overflow: hidden;
                border: 1px solid rgba(0,0,0,0.1);
                background: #ffffff;
            }

            .carousel-table-header {
                background: rgba(0,0,0,0.05);
                padding: 4px;
                font-size: 12px;
                font-weight: 900;
                color: black;
                display: flex;
                justify-content: space-between;
            }

            .carousel-current-header {
                border-left: 4px solid #000;
                background: rgba(0,0,0,0.05);
            }

            .carousel-table {
                width: 100%;
                border-collapse: collapse;
            }

            .carousel-table th {
                font-size: 12px;
                color: #666;
                padding: 8px;
            }

            .carousel-table td {
                padding: 9px 0px;
                text-align: center;
                border-bottom: 1px solid rgba(0,0,0,0.05);
                font-size: 12px;
                font-weight: 800;
            }

            .carousel-current-day {
                background: #00f2ff !important;
                color: #000000 !important;
                font-weight: 900 !important;
            }

            .carousel-current-day td {
                background: #00f2ff !important;
                color: #000000 !important;
            }

            .carousel-day-label {
                color: #ff9d00;
                font-size: 11px;
            }

            .year-nav-btn:active {
                transform: scale(0.95);
                opacity: 0.8;
            }
            
            /* One-row year nav, no wrap */
            .year-nav-container {
                display: flex;
                gap: 8px;
                justify-content: center;
                align-items: center;
                flex-wrap: nowrap;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding: 12px 8px;
                background: #fafafa;
                border-radius: 12px;
                border: 1px solid #e0e0e0;
                margin: 12px 0;
                scrollbar-width: none;
            }
            .year-nav-container::-webkit-scrollbar { display: none; }
            
            .year-view-label {
                text-align: center;
                margin: 4px 0 8px 0;
            }
            
            .year-view-label span {
                font-size: 11px;
                font-weight: 800;
                color: #000;
                padding: 3px 12px;
                border-radius: 12px;
            }
        </style>
    </head>
    <body>
        <div class="chart-container">
            <div class="watermark">CODEWITHGLASGOW</div>
            
            <div class="chart-header">
                <h1>${title} CHART</h1>
            </div>
            
            <!-- ============ ALL YEAR VIEWS (only one visible) ============ -->
            <div id="year-views-container">
                ${viewContainersHTML}
            </div>
            
            <!-- ============ YEAR SWITCH SCRIPT ============ -->
            <script>
                function switchYearView(year) {
                    // Hide all year views
                    document.querySelectorAll('.year-view').forEach(function(el) {
                        el.style.display = 'none';
                    });
                    
                    // Show selected
                    var selected = document.getElementById('year-view-' + year);
                    if (selected) selected.style.display = 'block';
                    
                    // Scroll to top
                    window.scrollTo(0, 0);
                }
            </script>
        </div>
    </body>
    </html>
    `;
    
    return html;
}

// ====================================
// RENDER SINGLE YEAR VIEW
// ====================================
function renderYearView(displayWeeks, allWeeks, view, isPlayWhe, title, viewKey, yearButtonsHTML, liveLM) {
    // *** USE LIVE LEAVING/MEETING FOR ALL VIEWS ***
    const lm = liveLM || { leavingNumber: null, leavingSlot: null, leavingDate: null, meetingNumber: null, meetingSlot: null, meetingDate: null };
    
    let leavingNumber = lm.leavingNumber;
    let leavingSlot = lm.leavingSlot;
    let leavingDate = lm.leavingDate;
    let meetingNumber = lm.meetingNumber;
    let meetingSlot = lm.meetingSlot;
    let meetingDate = lm.meetingDate;
    
    function formatShortDate(dateStr) {
        if (!dateStr) return "";
        const parts = dateStr.split(" ");
        const monthMap = {"Jan":1,"Feb":2,"Mar":3,"Apr":4,"May":5,"Jun":6,"Jul":7,"Aug":8,"Sep":9,"Oct":10,"Nov":11,"Dec":12};
        const day = parseInt(parts[0]);
        const month = monthMap[parts[1]];
        const year = parts[2].slice(-2);
        return `${day}/${month}/${year}`;
    }
    
    function formatDateDisplay(date) {
        if (!date) return "";
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} '${date.getFullYear().toString().slice(-2)}`;
    }
    
    function isDayPassed(weekStartDate, dayIndex) {
        if (!weekStartDate) return false;
        const parts = weekStartDate.split(" ");
        const monthMap = {"Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,"Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11};
        const startDate = new Date(parts[2], monthMap[parts[1]], parseInt(parts[0]));
        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + dayIndex);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return targetDate < today;
    }
    
    function isCurrentWeek(week) {
        if (!week) return false;
        if (week.isCurrentWeek !== undefined) return week.isCurrentWeek === true;
        if (!week.startDate) return false;
        const today = new Date();
        const parts = week.startDate.split(" ");
        const monthMap = {"Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,"Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11};
        const weekStart = new Date(parts[2], monthMap[parts[1]], parseInt(parts[0]));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return today >= weekStart && today <= weekEnd;
    }
    
    let leavingDisplay = "—";
    let meetingDisplay = "—";
    let leavingDateDisplay = "No data available";
    let meetingDateDisplay = "No data available";
    
    if (isPlayWhe) {
        if (leavingNumber) {
            leavingDisplay = `#${leavingNumber}`;
            leavingDateDisplay = leavingDate ? formatDateDisplay(leavingDate) : "—";
        }
        if (meetingNumber) {
            meetingDisplay = `#${meetingNumber}`;
            meetingDateDisplay = meetingDate ? formatDateDisplay(meetingDate) : "—";
        }
    }
    
    // ---------- BUILD TABLE ----------
    let tableHTML = `
        <div class="lm-container">
            <div class="lm-box leaving">
                <div class="label">LEAVING • ${leavingSlot || ''}</div>
                <div class="number">${leavingDisplay}</div>
                <div class="date">${leavingDateDisplay}</div>
            </div>
            <div class="lm-box meeting">
                <div class="label">MEETING • ${meetingSlot || ''}</div>
                <div class="number">${meetingDisplay}</div>
                <div class="date">${meetingDateDisplay}</div>
            </div>
        </div>
        
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th></th>
    `;
    
    for (let i = 0; i < dayShort.length; i++) {
        const borderClass = i > 0 ? 'day-border' : '';
        tableHTML += `<th colspan="4" class="${borderClass}">${dayShort[i]}</th>`;
    }
    tableHTML += `</tr></thead><tbody>`;
    
    displayWeeks.forEach((week, weekIndex) => {
        const isCurrent = week.isCurrentWeek === true || isCurrentWeek(week);
        const rowClass = isCurrent ? 'row-current' : (weekIndex % 2 === 0 ? 'row-odd' : 'row-even');
        const weekDate = formatShortDate(week.startDate);
        
        tableHTML += `<tr class="${rowClass}">`;
        tableHTML += `<td class="week-label">${weekDate}</td>`;
        
        for (let d = 0; d < daysOfWeek.length; d++) {
            const dayName = daysOfWeek[d];
            const day = week.days.find(dy => dy.dayName === dayName);
            const borderClass = d > 0 ? 'day-border' : '';
            
            let isHoliday = false;
            let hasDraw = false;
            if (day) {
                hasDraw = timeOrder.some(slot => {
                    const val = day.draws[slot];
                    return val && val !== "-" && val !== "PENDING";
                });
            }
            if (!hasDraw && isDayPassed(week.startDate, d)) isHoliday = true;
            
            if (isHoliday) {
                tableHTML += `<td colspan="4" class="holiday ${borderClass}">HOLIDAY</td>`;
                continue;
            }
            
            for (let s = 0; s < timeOrder.length; s++) {
                const slot = timeOrder[s];
                const val = day ? day.draws[slot] : null;
                const isValid = val && val !== "-" && val !== "PENDING";
                
                // Highlighting still uses LIVE leaving/meeting numbers
                let highlightClass = "";
                if (isPlayWhe && isValid) {
                    const valStr = val.toString().trim();
                    if (leavingNumber && valStr === leavingNumber.toString()) highlightClass = 'leaving-highlight';
                    else if (meetingNumber && valStr === meetingNumber.toString()) highlightClass = 'meeting-highlight';
                }
                
                const cellClass = s === 0 && d > 0 ? borderClass : '';
                const combinedClass = [cellClass, highlightClass].filter(c => c).join(' ');
                
                if (isCurrent && !isValid) {
                    if (isDayPassed(week.startDate, d)) {
                        tableHTML += `<td class="${combinedClass}" style="color:#999999;">...</td>`;
                    } else {
                        tableHTML += `<td class="${combinedClass}" style="color:#dddddd;">—</td>`;
                    }
                } else if (isValid) {
                    tableHTML += `<td class="${combinedClass}">${val}</td>`;
                } else {
                    tableHTML += `<td class="${combinedClass}" style="color:#dddddd;">—</td>`;
                }
            }
        }
        tableHTML += `</tr>`;
    });
    
    tableHTML += `</tbody></table></div>
        <div class="footer">
            <span>♠️ ${displayWeeks.length} weeks ${view.isLive ? '• CURRENT YEAR' : '• ' + view.label}</span>
            <span>CODEWITHGLASGOW ©️ CWG Charts Analysis</span>
        </div>
        <br>
        <div style="width:100%; height:2px; background:#000;"></div>
        
        <!-- ============ YEAR NAVIGATOR (below solid black line) ============ -->
        <div class="year-nav-container">
            <span style="font-size: 12px; font-weight: 800; color: #666; margin-right: 4px; flex-shrink: 0;">📅 YEAR:</span>
            ${yearButtonsHTML}
        </div>
        
        <div class="year-view-label">
            <span style="background:${view.isLive ? '#32d74b' : '#ff9d00'};">
                ${view.isLive ? '🟢 CURRENT YEAR (' + view.label + ')' : '📅 ' + view.label + ' (JAN–DEC)'}
            </span>
        </div>
        
        <div style="width:100%; height:2px; background:#000;"></div>
        <br>
        
        ${renderWheWheMarkAnalysis(displayWeeks)}
        
        <br>
        <div style="width:100%; height:2px; background:#000;"></div>
        <br>
        
        ${renderUnifiedCarouselContainer(displayWeeks)}
        
        <br>
        <div style="width:100%; height:2px; background:#000;"></div>
        <br>
        
        ${renderWheWheWeekendPicks(displayWeeks)}
        
        <br>
        <div style="width:100%; height:2px; background:#000;"></div>
        <br>
        
        ${renderIntelligentAnalysis(displayWeeks)}
    `;
    
    return tableHTML;
}