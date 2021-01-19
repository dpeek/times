import React, { useEffect, useState, useRef } from "react";
import { disableBodyScroll } from "body-scroll-lock";
import Button from "./Button";
import "./App.css";

const { Howl } = require("howler");

function shuffle(array) {
  return array.reduce((acc, item) => {
    acc.splice(Math.round(Math.random() * acc.length), 0, item);
    return acc;
  }, []);
}

function average(array) {
  return array.reduce((acc, i) => acc + i, 0) / array.length;
}

var wrong = new Howl({
  src: ["wrong.wav"],
});

var right = new Howl({
  src: ["right.mp3"],
});

function getQuestions() {
  let questions = [];
  for (let left = 2; left <= 12; left++) {
    for (let right = 2; right <= 12; right++) {
      let answer = left * right;
      let text = `${left} ✕ ${right}`;
      let decoys = [];
      for (let leftOffset = -2; leftOffset <= 2; leftOffset++) {
        for (let rightOffset = -2; rightOffset <= 2; rightOffset++) {
          let decoy = (left + leftOffset) * (right + rightOffset);
          if (decoy > 0 && !decoys.includes(decoy)) decoys.push(decoy);
        }
      }
      questions.push({ text, left, right, answer, decoys, results: [] });
    }
  }
  return questions;
}

const questions = getQuestions();

function loadResults() {
  let stored = localStorage.getItem("results");
  return (stored && JSON.parse(stored)) || [];
}

function saveResults(results) {
  localStorage.setItem("results", JSON.stringify(results));
  return results;
}

function getNextQuestion(results) {
  let lookup = {};
  results.forEach((result) => {
    let group = lookup[result.text] || [];
    group.unshift(result);
    lookup[result.text] = group;
  });

  let scores = {};
  questions.forEach((question) => {
    let group = lookup[question.text] || [];
    let count = Math.min(group.length, 4);
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += group[i].time;
    }
    scores[question.text] = total / count || 10000;
  });

  let sorted = shuffle([...questions]).sort((a, b) => {
    return scores[b.text] - scores[a.text];
  });

  console.log("--");
  for (let i = 0; i < 10; i++) {
    let { text } = sorted[i];
    let score = scores[text];
    console.log({ text, score });
  }

  return sorted[0];
}

function getTime() {
  return new Date().getTime();
}

function App() {
  const ref = useRef(null);

  const [results] = useState(loadResults());
  const [question, setQuestion] = useState(null);
  if (question === null) setQuestion(getNextQuestion(results));

  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [currentTable, setCurrentTable] = useState("All");
  const [startTime, setStartTime] = useState(getTime());

  const reset = () => {
    setAttempts(0);
  };

  const showNext = () => {
    setAttempts(0);
    setStartTime(getTime());
    setQuestion(getNextQuestion(results));
  };

  const onKeyDown = ({ key }) => {
    let num = parseInt(key);
    if (isNaN(num)) return;
    // checkAnswer(num);
    doAction(num);
  };

  useEffect(() => {
    if (ref.current) {
      disableBodyScroll(ref.current);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // useEffect(() => {
  //   showNext();
  //   // if (ref.current) {
  //   //   disableBodyScroll(ref.current);
  //   // }
  // }, []);

  // const checkAnswer = (num) => {
  //   if (num < 1 || num > 4) return;
  //   let answer = answers[num - 1];
  //   if (attempts.includes(answer)) return;
  //   if (answer === correct) {
  //     // setResults([...results, { question, correct: true }]);
  //     showNext();
  //     right.play();
  //   } else {
  //     // setResults([...results, { question, correct: false }]);
  //     setAttempts([...attempts, answer]);
  //     wrong.play();
  //   }
  // };

  const switchTable = (table) => {
    if (table === currentTable) return;
    setCurrentTable(table);
    showNext();
  };

  let tables = ["All"];
  for (let i = 2; i <= 12; i++) tables.push(i);

  const doAction = (action) => {
    if (!isNaN(action)) {
      let attempt = input + action;
      if (parseInt(attempt) === answer) {
        onCorrect();
      } else {
        if (String(answer).indexOf(attempt) !== 0) {
          onIncorrect();
        } else {
          setInput(attempt);
        }
      }
    }
    if (action === "✕") {
      setInput("");
    }
  };

  let rows = [
    [7, 8, 9],
    [4, 5, 6],
    [1, 2, 3],
    ["", 0, "✕"],
  ];
  let keys = rows.map((row, i) => {
    return (
      <div key={i} className="row">
        {row.map((action, j) => (
          <Button key={j} action={() => doAction(action)}>
            {action}
          </Button>
        ))}
      </div>
    );
  });

  if (question === null) {
    return (
      <div className="App" ref={ref}>
        <Button action={() => showNext()}>Start</Button>
      </div>
    );
  }

  const { text, answer } = question;

  let numQuestions = results.length;
  let numFarts = 0;
  let tableStats = {};
  results.forEach((result) => {
    numFarts += result.attempts;
    let table = result.text.split(" ")[0];
    let stats = tableStats[table] || { times: [] };
    stats.times.push(result.time);
    tableStats[table] = stats;
  });
  let bestTime = 100000;
  let bestTable = null;
  let worstTime = 0;
  let worstTable = null;
  Object.keys(tableStats).forEach((key) => {
    let stats = tableStats[key];
    let averageTime = average(stats.times);
    if (averageTime < bestTime) {
      bestTime = averageTime;
      bestTable = key;
    }
    if (averageTime > worstTime) {
      worstTime = averageTime;
      worstTable = key;
    }
  });

  const onCorrect = () => {
    let time = getTime() - startTime;
    let result = { text, time, attempts };
    results.push(result);
    saveResults(results);
    setInput("");
    right.play();
    showNext();
  };

  const onIncorrect = () => {
    setInput("");
    wrong.play();
    setAttempts(attempts + 1);
  };

  return (
    <div className="App" ref={ref}>
      <div>
        {tables.map((table) => (
          <div
            key={table}
            className={"table" + (table === currentTable ? " active" : "")}
            onClick={() => switchTable(table)}
          >
            {table}
          </div>
        ))}
      </div>
      <div className="spacer" />
      <div className="card">
        {text} = {input}
      </div>
      {/* <div className="answers">
        {answers.map((answer, i) => (
          <div
            key={i}
            className={attempts.includes(answer) ? "answer attempt" : "answer"}
            onClick={() => checkAnswer(answer)}
          >
            <span className="text">{answer}</span>
            <span className="key">{i + 1}</span>
          </div>
        ))}
      </div> */}
      {keys}
      <div className="spacer" />
      <div className="stats">
        <div>Questions: {numQuestions}</div>
        <div>Farts: {numFarts}</div>
        <div>Best Table: {bestTable}</div>
        <div>Worst Table: {worstTable}</div>
      </div>
      <div className="results">
        <button className="reset" onClick={() => reset()}>
          Reset
        </button>
        <button
          className="reset"
          onClick={() => (window.location = String(window.location))}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export default App;
