import React, { useState, useEffect } from "react";
import "./App.css";
import * as XLSX from "xlsx";
import rulesImage from "./2024聖誕節活動說明v3.png"; // 引入圖片

const MAX_BUDGET = 6000;
const LEVEL_REWARDS = [0, 100, 300, 500];

function App() {
  const [players, setPlayers] = useState(() => {
    // 初始時從 localStorage 加載數據
    const savedPlayers = localStorage.getItem("players");
    return savedPlayers ? JSON.parse(savedPlayers) : [];
  });

  const [budget, setBudget] = useState(() => {
    const savedBudget = localStorage.getItem("budget");
    return savedBudget ? JSON.parse(savedBudget) : MAX_BUDGET;
  });

  const [isAnimating, setIsAnimating] = useState(false); // 控制金錢動畫

  // 每次 players 或 budget 更新時保存至 localStorage
  useEffect(() => {
    localStorage.setItem("players", JSON.stringify(players));
    localStorage.setItem("budget", JSON.stringify(budget));
  }, [players, budget]);

  const addPlayer = (name, id) => {
    if (name.trim() && id.trim()) {
      setPlayers([...players, { id, name, level: 0, reward: 0 }]);
    }
  };

  const updateLevel = (index, newLevel) => {
    const currentPlayer = players[index];
    const oldReward = LEVEL_REWARDS[currentPlayer.level] || 0;
    const newReward = LEVEL_REWARDS[newLevel] || 0;

    if (newLevel < currentPlayer.level) {
      if (!window.confirm("您正在降低該玩家的級別，確定繼續嗎？")) return;
    }

    if (budget - newReward + oldReward >= 0) {
      const updatedPlayers = [...players];
      updatedPlayers[index] = {
        ...currentPlayer,
        level: newLevel,
        reward: newReward,
      };
      setPlayers(updatedPlayers);
      setBudget((prevBudget) => {
        setIsAnimating(true); // 啟動動畫
        return prevBudget - newReward + oldReward;
      });

      // 停止動畫
      setTimeout(() => setIsAnimating(false), 500);
    } else {
      alert("獎金不足，無法進行操作！");
    }
  };

  const clearData = () => {
    if (window.confirm("確定要清除所有數據嗎？")) {
      setPlayers([]);
      setBudget(MAX_BUDGET);
      localStorage.removeItem("players");
      localStorage.removeItem("budget");
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      players.map((player) => ({
        員工編號: player.id,
        玩家姓名: player.name,
        最高級別: player.level,
        獎金: player.reward,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Players");
    XLSX.writeFile(workbook, "玩家記分板.xlsx");
  };

  const showImportFromExcel = () => {
    // show or hide btn of import
    if (document.getElementById("import_btn").style.display !== "none") {
      document.getElementById("import_btn").style.display = "none";
    } else {
      document.getElementById("import_btn").style.display = "block";
    }
  };
    

  const importFromExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const importedData = XLSX.utils.sheet_to_json(worksheet);
  
      const importedPlayers = importedData.map((row) => ({
        id: row["員工編號"],
        name: row["玩家姓名"],
        level: row["最高級別"] || 0,
        reward: row["獎金"] || 0,
      }));
  
      // 更新玩家和獎金
      const totalRewards = importedPlayers.reduce(
        (acc, player) => acc + (LEVEL_REWARDS[player.level] || 0),
        0
      );
  
      if (totalRewards <= MAX_BUDGET) {
        setPlayers(importedPlayers);
        setBudget(MAX_BUDGET - totalRewards);
      } else {
        alert("匯入數據的獎金超出最大預算，請檢查數據！");
      }
    };
  
    reader.readAsArrayBuffer(file);
  };
  
  // function myFunction() {
  //   const stickyTop = document.getElementById("main_section").offsetTop;
  //   if (window.scrollY > stickyTop) {
  //     document.getElementById("rules_section").classList.add("rules-fixed");
  //     document.getElementById("rules_section_padding").style.display = "";
  //   } else {
  //     document.getElementById("rules_section").classList.remove("rules-fixed");
  //     document.getElementById("rules_section_padding").style.display = "none";
  //   }
  // }
  // window.onscroll = function() {myFunction()};

  return (
    <div className="app">
      
      <div className="scoreboard-section">
        <header className="header">
          <h1>🎄 套住吵吵鴨 🎄</h1>
          <p
            className={`budget ${
              isAnimating ? budget > 3000 ? "animate-budget budget-high" : budget > 1000 ? "animate-budget budget-mid" : "animate-budget budget-low" : ""
            }`}>剩餘獎金：<strong>${budget}</strong></p>
        </header>

        <div id="main_section" className="main-container">
          {/* 左半部分：sticky 規則圖片 */}
          {/* <div id="rules_section" className="rules-section">
            <img
              src={rulesImage}
              alt="遊戲規則"
              className="rules-image"
            />
          </div> */}
          {/* 左半部分：padding */}
          <div id="rules_section_padding" className="rules-section" >
            <img
              src={rulesImage}
              alt="遊戲規則"
              className="rules-image"
            />
          </div>
          {/* 右半部分：計分板 */}
          <div className="game-area">
            <AddPlayerForm addPlayer={addPlayer} />
            <PlayerList players={players} updateLevel={updateLevel} />
            <div className="controls">
              <button className="export-btn" onClick={exportToExcel}>
                匯出至 Excel
              </button>
              <button className="import-btn-switch" onClick={showImportFromExcel}>
                匯入自 Excel
              </button>
              <input id="import_btn" style={{ display: "none" }}
                type="file"
                accept=".xlsx, .xls"
                className="import-btn"
                onChange={importFromExcel}
              />
              <button className="clear-btn" onClick={clearData}>
                清除數據
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerList({ players, updateLevel }) {
  return (
    <div className="player-list">
      <h2>玩家列表</h2>
      {players.length === 0 ? (
        <p>尚無玩家，請添加！</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>玩家姓名</th>
              <th>員工編號</th>
              <th>最高級別</th>
              <th>目前獎金</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={index}>
                <td>{player.name}</td>
                <td>{player.id}</td>
                <td>{player.level}</td>
                <td>${player.reward}</td>
                <td>
                  <LevelButtons
                    currentLevel={player.level}
                    onUpdate={(level) => updateLevel(index, level)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function LevelButtons({ currentLevel, onUpdate }) {
  return (
    <div className="level-buttons">
      {LEVEL_REWARDS.map((_, level) => (
        <button
          key={level}
          onClick={() => onUpdate(level)}
          disabled={level === currentLevel}
        >
          級別{level}
        </button>
      ))}
    </div>
  );
}

function AddPlayerForm({ addPlayer }) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    addPlayer(name, id);
    setName("");
    setId("");
  };

  return (
    <form className="add-player-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="玩家姓名"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="員工編號"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      <button type="submit">添加玩家</button>
    </form>
  );
}

export default App;
