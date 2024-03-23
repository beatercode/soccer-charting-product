const fs = require("fs");
const { normalize } = require("path");
const path = require("path");
const X2JS = require("x2js");
var x2js = new X2JS();

const pathSettings = "./public/data/settings.json";
const basePathInput = "./public/data/input/";
const basePathOutout = "./public/data/output/";
const defaultMatchId = "71pif9hi2vwzp6q0xzilyxst0";
const defaultMatchJsonExt = ".json";
const defaultMatchXmlExt = ".xml";

const chartMultiplier = 10;
let startChart = 50 * chartMultiplier;

let chartSettings = {};

// impl get start/curr quotes avg from big top 3
let startQuotes = [1.3, 4.8];
let currQuotes = [-1, -1];

/**
 * Takes a number as input, multiplies it by 10^5, rounds it, and returns the result divided by 10^5.
 *
 * @param {number} numero - The number to be processed
 * @return {number} The processed number after multiplication and rounding
 */
const fd = (numero) => (isNaN(numero) ? 0 : Math.round(numero * 1e5) / 1e5);

async function ensureFileExists(filePath, matchData) {
  try {
    await fs.promises.access(filePath);
  } catch (err) {
    if (err.code === "ENOENT") {
      const fileContent = JSON.stringify(
        {
          matchId: matchData.matchId,
          description: matchData.description,
          homeTeamName: matchData.homeTeamName,
          homeTeamShortName: matchData.homeTeamShortName,
          awayTeamName: matchData.awayTeamName,
          awayTeamShortName: matchData.awayTeamShortName,
          timeframe: { second: [], fivesecond: [], fifteensecond: [], minute: [] },
        },
        null,
        2
      );
      await fs.promises.writeFile(filePath, fileContent);
    } else {
      throw err;
    }
  }
}

function getTextTypeEvent(eventTypeId, outcome, qualifierId) {
  const event = chartSettings.events?.[eventTypeId] ?? "";
  const eventMacro = event?.description ?? "";
  const eventDescription = event?.outcome?.[outcome]?.qualifier?.[qualifierId]?.description ?? "";

  return { eventMacro, eventDescription };
}

function getValueOfEvent(eventTypeId, outcome, qualifierId, isHome, lastClose) {
  let retValue = 0;
  const event = chartSettings.events?.[eventTypeId]?.outcome?.[outcome];

  retValue = event
    ? qualifierId && event.qualifier?.[qualifierId]
      ? event.qualifier[qualifierId].vote ?? event.vote ?? 0
      : event.vote ?? 0
    : 0;

  if (retValue === 0) return retValue;
  retValue = retValue * chartMultiplier;

  const isHomeMul = isHome ? 1 : -1;
  const isIncrease = retValue > 0 ? 1 : -1;
  const lastClosePositive = lastClose >= startChart ? 1 : -1;

  // currQuotes[0] = currQuotes[0] === -1 ? startQuotes[0] : currQuotes[0];
  // currQuotes[1] = currQuotes[1] === -1 ? startQuotes[1] : currQuotes[1];

  // const currQuoteTeam = currQuotes[isHome ? 0 : 1];
  // console.log(`------------------------------------------------`);
  // console.log(`Team [HOME] - Quote [${currQuotes[0]}]`);
  // console.log(`Team [AWAY] - Quote [${currQuotes[1]}]`);

  // retValue = isHomeMul * isIncrease * retValue + -lastClosePositive * ((retValue / (startChart * 2)) * lastClose);
  retValue = isHomeMul * isIncrease * retValue;

  // find a way to increment/decrement currQuotess
  // currQuotes[0] = fd(currQuotes[0] + (currQuotes[0] / 100) * -isHomeMul * ((retValue / (startChart * 2)) * lastClose));
  // currQuotes[1] = fd(currQuotes[1] + (currQuotes[1] / 100) * isHomeMul * ((retValue / (startChart * 2)) * lastClose));

  return retValue;
}

function normalizeValue(value, lastClose) {
  return value + -(lastClose >= startChart ? 1 : -1) * ((value / (startChart * 2)) * lastClose);
}

async function fillTimestampGaps(allEvents) {
  for (let key in allEvents) {
    const chartSetting = chartSettings.timeframes.find((t) => t.text == key);
    const filledEvents = await fillTimestampGapsHelper(allEvents[key], chartSetting.ms);
    allEvents[key] = filledEvents;
  }

  return allEvents;
}

async function fillTimestampGapsHelper(events, tfms) {
  const secondMs = 1000;
  const filledEvents = {};
  const eventKeys = Object.keys(events).sort((a, b) => Number(a) - Number(b));

  let prevKey = null;
  let prevEvent = null;

  for (let i = 0; i < eventKeys.length; i++) {
    const key = eventKeys[i];
    const event = events[key];

    if (prevKey === null) {
      filledEvents[key] = event;
      prevKey = Number(key);
      prevEvent = event;
    } else {
      const gap = Number(key) - Number(prevKey);
      // console.log("Number(key), Number(prevKey): ", Number(key), Number(prevKey));
      // console.log("Check gap: ", gap, "tfms / secondMs", tfms / secondMs);

      if (gap > tfms / secondMs) {
        for (let j = tfms / secondMs; j <= gap; j += tfms / secondMs) {
          const newKey = prevKey + j;
          const newTimestamp = prevEvent.timestamp + j * secondMs;
          const newEvent = {
            timestamp: newTimestamp,
            open: event.close,
            high: event.close,
            low: event.close,
            close: event.close,
            volume: 0,
            event: {
              type: "",
              eventId: "",
              typeId: "",
              outcome: "",
              periodId: "",
              contestantId: "",
              playerId: "",
              playerName: "",
            },
          };

          filledEvents[newKey] = newEvent;
        }
      }

      filledEvents[key] = event;
      prevKey = Number(key);
      prevEvent = event;
    }
  }

  return filledEvents;
}

async function extractData(matchData) {
  if (!matchData) return;

  const { matchDetails, events } = matchData.matchEvents.liveData;
  const event = events.event;
  const matchInfo = matchData.matchEvents.matchInfo;
  const matchStart = new Date(matchDetails.periods.period[0]._start).getTime();
  const matchId = matchInfo._id;

  const homeTeamId = matchInfo.contestants.contestant.find((c) => c._position === "home")._id;

  const matchMainData = {
    matchId: matchId,
    description: matchInfo.description,
    homeTeamName: matchInfo.contestants.contestant.find((c) => c._position === "home")._officialName,
    homeTeamShortName: matchInfo.contestants.contestant.find((c) => c._position === "home")._shortName,
    awayTeamName: matchInfo.contestants.contestant.find((c) => c._position === "away")._officialName,
    awayTeamShortName: matchInfo.contestants.contestant.find((c) => c._position === "away")._shortName,
  };
  const groupedData = {};
  // let filledEvent = event;
  let lastSavedEvent = { close: startChart, event: {} };

  for (const [index, eData] of event.entries()) {
    // skip if after match or pre match
    if (eData._periodId == 14 || eData._periodId == 16) {
      continue;
    }

    // console.log("---------------------------------------------\nlastSavedEvent, ");
    // console.log(lastSavedEvent.event);

    const timestamp = new Date(eData._timeStamp).getTime();
    const timeMin = eData._timeMin;
    const timeSec = eData._timeSec;

    const isHome = eData._contestantId === homeTeamId;

    const qualifierId = Array.isArray(eData.qualifier) ? eData.qualifier?.[0]?._qualifierId || 0 : eData.qualifier?._qualifierId || 0;
    const qualifierIds = Array.isArray(eData.qualifier) ? eData.qualifier?.map((x) => x._qualifierId) : [];
    // console.log(Array.isArray(eData.qualifier), qualifierId, qualifierIds);

    let uniqueParial = [];
    let valueChangeTot = 0;
    for (const q of qualifierIds) {
      const newPartial = getValueOfEvent(eData._typeId, eData._outcome, q, isHome);
      if (!uniqueParial.includes(newPartial)) {
        uniqueParial.push(newPartial);
        valueChangeTot += newPartial;
        // console.log("q", q, "[valueChange partial]", newPartial);
      }
    }

    const { eventMacro, eventDescription } = getTextTypeEvent(eData._typeId, eData._outcome);

    const valueChangePre = getValueOfEvent(eData._typeId, eData._outcome, qualifierId, isHome);
    const valueChange = normalizeValue(valueChangePre, lastSavedEvent.close);
    valueChangeTot = normalizeValue(valueChangeTot, lastSavedEvent.close);

    // Combine calculations for efficiency
    const nextClose = lastSavedEvent.close + valueChangeTot;
    // const nextClose = lastSavedEvent.close + valueChange;
    const nextHigh = Math.max(lastSavedEvent.close, nextClose);
    const nextLow = Math.min(lastSavedEvent.close, nextClose);

    // use 1 second for first checks - then iterate on all timeframes
    const indexTf = 0;
    const tf = chartSettings.timeframes[indexTf];

    const smallestTimeFrameKey = tf.text;
    const groupTimeFrame = Math.trunc(timestamp / tf.ms) * tf.ms;
    const groupTimeMinSec = parseInt(timeMin) * 60 + parseInt(timeSec);

    // console.log("CHECK [3]", "nextClose", nextClose, "valueChange", valueChange);
    // console.log("CHECK [3]", "nextClose", nextClose, "nextHigh", nextHigh, "nextLow", nextLow, "groupTimeMinSec", groupTimeMinSec);

    if (!groupedData[smallestTimeFrameKey]) groupedData[smallestTimeFrameKey] = {};

    const secondRest = groupTimeMinSec % (tf.ms / 1000);
    // console.log(`[rest] [${indexTf}] current ts: ${groupTimeMinSec} - rest is ${secondRest}`);

    const newSecond = !groupedData[smallestTimeFrameKey][groupTimeMinSec];
    // console.log("working on tf", tf.ms / 1000, "correct multiple found", 1, "isNew?", newSecond);

    if (newSecond) {
      groupedData[smallestTimeFrameKey][groupTimeMinSec] = {
        timestamp: groupTimeFrame,
        open: fd(lastSavedEvent.close),
        high: fd(nextHigh),
        low: fd(nextLow),
        close: fd(nextClose),
        volume: 1,
        event: {
          type: { eventMacro, eventDescription },
          eventId: eData._eventId || "",
          typeId: eData._typeId || "",
          outcome: eData._outcome || "",
          periodId: eData._periodId || "",
          contestantId: eData._contestantId || "",
          playerId: eData._playerId || "",
          playerName: eData._playerName || "",
        },
      };
      lastSavedEvent = groupedData[smallestTimeFrameKey][groupTimeMinSec];
    } else {
      groupedData[smallestTimeFrameKey][groupTimeMinSec].volume++;
      groupedData[smallestTimeFrameKey][groupTimeMinSec].close = fd(nextClose);
      groupedData[smallestTimeFrameKey][groupTimeMinSec].high = fd(
        Math.max(groupedData[smallestTimeFrameKey][groupTimeMinSec].high, nextClose)
      );
      groupedData[smallestTimeFrameKey][groupTimeMinSec].low = fd(
        Math.min(groupedData[smallestTimeFrameKey][groupTimeMinSec].low, nextClose)
      );
    }

    for (let i = chartSettings.timeframes.length - 1; i > indexTf; i--) {
      const timeFrameKey = chartSettings.timeframes[i].text;
      const timeFrameMs = chartSettings.timeframes[i].ms;
      // console.log("working on tf", timeFrameMs / 1000);

      let secMultiple = timeFrameMs / 1000;
      while (secMultiple <= secondRest || secMultiple <= groupTimeMinSec) {
        secMultiple += timeFrameMs / 1000;
      }

      if (!groupedData[timeFrameKey]) groupedData[timeFrameKey] = {};
      const isNew = !groupedData[timeFrameKey][secMultiple];
      // console.log("correct multiple found", secMultiple, "isNew?", isNew);

      if (isNew) {
        groupedData[timeFrameKey][secMultiple] = {
          timestamp: groupTimeFrame,
          open: fd(lastSavedEvent.close),
          high: fd(nextHigh),
          low: fd(nextLow),
          close: fd(nextClose),
          volume: 1,
          event: {
            type: { eventMacro, eventDescription },
            eventId: eData._eventId || "",
            typeId: eData._typeId || "",
            outcome: eData._outcome || "",
            periodId: eData._periodId || "",
            contestantId: eData._contestantId || "",
            playerId: eData._playerId || "",
            playerName: eData._playerName || "",
          },
        };
        lastSavedEvent = groupedData[timeFrameKey][secMultiple];
      } else {
        groupedData[timeFrameKey][secMultiple].volume++;
        groupedData[timeFrameKey][secMultiple].close = fd(nextClose);
        groupedData[timeFrameKey][secMultiple].high = fd(Math.max(groupedData[timeFrameKey][secMultiple].high, nextClose));
        groupedData[timeFrameKey][secMultiple].low = fd(Math.min(groupedData[timeFrameKey][secMultiple].low, nextClose));
      }
    }
  }

  const groupedDataNoGap = await fillTimestampGaps(groupedData);

  // console.log("groupedData", groupedData);
  // console.log("groupedDataNoGap", groupedDataNoGap);

  const transformedData = {};
  for (const timestampKey in groupedDataNoGap) {
    transformedData[timestampKey] = [];
    for (const tsKey in groupedDataNoGap[timestampKey]) {
      const eventData = groupedDataNoGap[timestampKey][tsKey];
      transformedData[timestampKey].push(eventData);
    }
  }

  console.log("> transformedData [lenght] :");
  console.log(transformedData.second.length);
  console.log(transformedData.fivesecond.length);
  console.log(transformedData.fifteensecond.length);
  console.log(transformedData.minute.length);

  return { transformedData, matchMainData };
}

async function updateChartData(partialChartData, matchMainData) {
  const filePath = basePathOutout.concat(matchMainData.matchId, defaultMatchJsonExt);
  await ensureFileExists(filePath, matchMainData);
  const fileContent = await fs.promises.readFile(filePath, "utf-8");
  const jsonData = JSON.parse(fileContent);

  for (const key in partialChartData) {
    const existingTimestamps = new Set(jsonData.timeframe[key].map((d) => d[0]));
    const events = partialChartData[key];
    const newEvents = [];

    for (const [index, event] of events.entries()) {
      const timestamp = event.timestamp;

      // if (!existingTimestamps.has(timestamp)) {
      if (true) {
        const newEvent = [timestamp, event.open, event.high, event.low, event.close, event.volume, event.event];
        newEvents.push(newEvent);
        existingTimestamps.add(timestamp);
      } else {
        // console.log(index, "exist");
        // console.log(index - 1, "PRE - ", event.open, event.close, "POST - ", events[index - 1]?.open, events[index - 1]?.close);
      }
    }

    const sortedEvents = [...newEvents];
    sortedEvents.sort((a, b) => a[0] - b[0]);
    const isSorted = JSON.stringify(newEvents) !== JSON.stringify(sortedEvents);
    // console.log("Sorting result:", isSorted);
    jsonData.timeframe[key] = sortedEvents.concat(jsonData.timeframe[key]);
  }

  await fs.promises.writeFile(filePath, JSON.stringify(jsonData, null, 2));
}

async function monitorAllFiles() {
  const dataFolderPath = path.join(__dirname, "../public", "data", "input");
  const files = fs.readdirSync(dataFolderPath);
  const xmlFiles = files.filter((file) => file.endsWith(defaultMatchXmlExt));

  await Promise.all(xmlFiles.map((fileName) => monitorFile(fileName)));
}

async function singleShot(monitorFileName = null, deleteBefore = false) {
  const dataFolderPath = path.join(__dirname, "../public", "data");
  const filePath = dataFolderPath.concat("/input/", monitorFileName || defaultMatchId.concat(defaultMatchXmlExt));
  const filePathOutput = dataFolderPath.concat(
    "/output/",
    monitorFileName.replace(defaultMatchXmlExt, defaultMatchJsonExt) || defaultMatchId.concat(defaultMatchJsonExt)
  );
  const fileExist = fs.existsSync(filePathOutput);
  if (fileExist && deleteBefore) await fs.promises.unlink(filePathOutput);
  const currentContentXml = await fs.promises.readFile(filePath, { encoding: "utf8", flag: "r" });
  const currentContentJs = x2js.xml2js(currentContentXml);
  await doOperations(currentContentJs);
}

async function monitorFile(monitorFileName = null) {
  const dataFolderPath = path.join(__dirname, "../public", "data");
  const filePath = dataFolderPath.concat("/input/", monitorFileName || defaultMatchId.concat(defaultMatchXmlExt));
  const filePathOutput = dataFolderPath.concat(
    "/output/",
    monitorFileName.replace(defaultMatchXmlExt, defaultMatchJsonExt) || defaultMatchId.concat(defaultMatchJsonExt)
  );
  const previousContentXml = await fs.promises.readFile(filePath, { encoding: "utf8", flag: "r" });
  let previousContentJson = x2js.xml2js(previousContentXml);

  while (true) {
    const currentContentXml = await fs.promises.readFile(filePath, { encoding: "utf8", flag: "r" });
    const currentContentJson = x2js.xml2js(currentContentXml);

    const fileExist = fs.existsSync(filePathOutput);

    if (
      !fileExist ||
      currentContentJson.matchEvents.liveData.events.event.length > previousContentJson.matchEvents.liveData.events.event.length
    ) {
      previousContentJson = currentContentJson;
      await doOperations(currentContentJson);
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

async function doOperations(currentContent) {
  console.info(`[IN] DATA UPDATED [${Date.now()}]`);
  chartSettings = await JSON.parse(await fs.promises.readFile(pathSettings, "utf-8"));

  try {
    // const jsonContent = await JSON.parse(currentContent);
    const jsonContent = currentContent;
    const { transformedData, matchMainData } = await extractData(jsonContent);
    console.info(`[1/2] UP DONE [${Date.now()}]`);

    await updateChartData(transformedData, matchMainData);
    console.info(`[2/2] UP DONE [${Date.now()}]`);
  } catch (error) {
    console.error("Error parsing JSON file:", error.message);
  }
}

// monitorFile("71pif9hi2vwzp6q0xzilyxst0");
// monitorAllFiles();
// singleShot("mod_testing_random.xml");

// file to run, delete before? (true|false)
// singleShot("9uzxz9w2owmody3ri5fuhx990.xml", true);
singleShot("9uzxz9w2owmody3ri5fuhx990.xml", true);
