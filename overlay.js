  class MafiaOverlay {
    constructor() {
      this.gameNumber = localStorage.getItem("gameNumber") || "1";
      this.historyStack = [];
      this.phase = "setup";
      this.shots = [];
      this.sheriffChecks = [];
      this.donChecks = [];
      this.votedOut = [];
      this.nominated = [];
      this.judge = "";
      this.availableRoles = ["civilian", "mafia", "don", "sheriff"];
      this.roleLimits = { "mafia": 2, "don": 1, "sheriff": 1 };
      this.firstNightPassed = false; 

      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "overlay") {
        this.players = JSON.parse(localStorage.getItem("mafiaPlayers")) || [];
        this.judge = localStorage.getItem("mafiaJudge") || "";
        this.initOverlay();
        this.syncOverlayWithStorage();
      } else if (params.get("view") === "control") {
        this.initControlPanel();
      }
    }

    initOverlay() {
      const overlay = document.createElement("div");
      overlay.id = "mafia-overlay";
      
      overlay.innerHTML = `
        <div id="events-container">
        <div class="wrapper"><div class="events-container__child"><div class="game-number-container"><h3>Гра №<span id="game-number">1</span></h3></div>
        <div id="nominated-info"></div></div>
          <div class="events-container__info" id="shots-info"></div>
          <div class="events-container__info" id="sheriff-info"></div>
          <div class="events-container__info" id="don-info"></div>
          <div class="events-container__info" id="voted-info"></div>
          </div>
          
          <div class="events-container__child">
          <img class="UML_logo" src="./img/UML_Logo.png" alt="logo">
        <div class="judge_box"><h3>Суддя</h3><span id="judge-name">${this.judge}</span></div></div>
        </div>
        
        <div id="players-info"></div>
      
      `;
      document.body.appendChild(overlay);
      this.updateOverlay();
      window.addEventListener("storage", (event) => {
      if (event.key === "updateOverlay") {
          this.updateOverlay();
      }
  });
    }

    syncOverlayWithStorage() {
      setInterval(() => {
        const newPlayers = JSON.parse(localStorage.getItem("mafiaPlayers")) || [];
        const newJudge = localStorage.getItem("mafiaJudge") || "";
        const newNominated = JSON.parse(localStorage.getItem("mafiaNominated")) || [];
        const newPhase = localStorage.getItem("gamePhase") || "setup";

        if (
          JSON.stringify(this.players) !== JSON.stringify(newPlayers) ||
          this.judge !== newJudge ||
          JSON.stringify(this.nominated) !== JSON.stringify(newNominated) ||
          this.phase !== newPhase
        ) {
          this.players = newPlayers;
          this.judge = newJudge;
          this.nominated = newNominated;
          this.phase = newPhase;
          document.getElementById("judge-name").innerText = this.judge;

          this.updateOverlay();
        }
      }, 1000);
    }

        updateOverlay() {
      this.historyStack.push(JSON.stringify({
      players: this.players,
      shots: this.shots,
      sheriffChecks: this.sheriffChecks,
      donChecks: this.donChecks,
      nominated: this.nominated,
      votedOut: this.votedOut,
      phase: this.phase
  }));

  if (this.historyStack.length > 2) {
      this.historyStack.shift();
  }

      const gameNumberElement = document.getElementById("game-number");
      if (gameNumberElement) {
        gameNumberElement.innerText = this.gameNumber;
      }
      const playersInfo = document.getElementById("players-info");
      if (playersInfo) {
        this.players.forEach(player => {
          let playerElement = document.getElementById(`player-${player.number}`);
          if (!playerElement) {
            playerElement = document.createElement("div");
            playerElement.id = `player-${player.number}`;
            playersInfo.appendChild(playerElement);
          }

          playerElement.className = `player ${player.role} ${player.status}`;

          let bestMoveDiv = playerElement.querySelector(".best-move");

  if (player.status === "killed") {
      if (!bestMoveDiv) {
          bestMoveDiv = document.createElement("div");
          bestMoveDiv.className = "best-move";
          bestMoveDiv.innerHTML = `<p>КХ</p>`;
          playerElement.appendChild(bestMoveDiv);
      }

      const savedNumbers = JSON.parse(localStorage.getItem(`bestMove-${player.number}`)) || [];
      bestMoveDiv.innerHTML = `<p>КХ</p>`;

      savedNumbers.forEach(num => {
          const playerObj = this.players.find(p => p.number === num);
          if (playerObj) {
              const roleClass = this.getRoleClass(playerObj.role);
              const numDiv = document.createElement("div");
              numDiv.className = roleClass;
              numDiv.textContent = num;
              bestMoveDiv.appendChild(numDiv);
          }
      });

      if (bestMoveDiv.querySelectorAll("div").length > 0) {
          bestMoveDiv.style.display = "flex"; 
      } else {
          bestMoveDiv.style.display = "none"; 
      }
  } else if (bestMoveDiv) {
      bestMoveDiv.remove();
  }


          

        const playerContent = `<div class="player-photo"><img class="player-img" src="./img/${player.name}.png" alt=""> 
      <div class="player__sheriff"><svg class="players-svg" width="30px" height="30px">
                  <use href="./img/sprite.svg#icon-sheriff"></use>
                </svg></div> 
      <div class="player__don"><svg class="players-svg" width="35px" height="35px">
                  <use href="./img/sprite.svg#icon-hat"></use>
                </svg></div>
      <div class="player__killed"><svg class="players-svg" width="38px" height="38px">
                  <use href="./img/sprite.svg#icon-killed"></use>
                </svg></div>
      <div class="player__foul" style="display: ${player.fouls > 0 ? "block" : "none"};">
          ${"!".repeat(player.fouls)}
      </div>
      <div class="player__voted"><svg class="players-svg" width="30px" height="30px">
                  <use href="./img/sprite.svg#icon-voted"></use>
                </svg></div>
      <div class="player__deleted"><svg class="players-svg" width="26px" height="26px">
                  <use href="./img/sprite.svg#icon-deleted"></use>
                </svg></div> </div>
      <div class="player__info">
          <span class="player__number">${player.number}</span> 
          <span class="player__name">${player.name}</span>
      </div>`;

  if (!playerElement.querySelector(".best-move")) {
      playerElement.innerHTML = playerContent;
  } else {
      playerElement.innerHTML = playerContent + playerElement.querySelector(".best-move").outerHTML;
  }

        });
      }

      const noVoteButton = document.getElementById("no-vote-button");
  if (noVoteButton) {
      noVoteButton.style.display = this.phase === "day" ? "block" : "none";
      }
      
      
      const nominatedInfo = document.getElementById("nominated-info");
      if (nominatedInfo) {
    nominatedInfo.innerHTML = `<h3>Виставлені</h3>` +
      this.nominated.map(num => {
        const player = this.players.find(p => p.number === num);
        const roleClass = player ? this.getRoleClass(player.role) : "";
        return `<div class="${roleClass}">${num}</div>`;
      }).join("");
      }


      
      const votedInfo = document.getElementById("voted-info");
  if (votedInfo) {
      const votingHistory = JSON.parse(localStorage.getItem("votingHistory")) || [];
      votedInfo.innerHTML = `<svg class="actions-svg" width="22px" height="22px">
                  <use href="./img/sprite.svg#icon-voted"></use>
                </svg>` +
          votingHistory.map(v => {
              if (v === "-") {
                  return `<div class="civilian-num">x</div>`;
              }
              const player = this.players.find(p => p.number === v);
              const roleClass = player ? this.getRoleClass(player.role) : "";
              return `<div class="${roleClass}">${v}</div>`;
          }).join("");
      
      votedInfo.style.display = votingHistory.length > 0 ? "flex" : "none";
  }




      const nominationSection = document.getElementById("nomination-buttons");
      const controlNominatedSection = document.getElementById("control-nominated-info");

      const controlNominatedInfo = document.getElementById("control-nominated-info");
      if (controlNominatedInfo) {
        controlNominatedInfo.innerHTML = `<h3>Виставлені</h3>` +
          this.nominated.map(num => `<div>${num}</div>`).join("");
      }


      if (this.phase === "night") {
        if (nominationSection) nominationSection.style.display = "none";
        if (controlNominatedSection) controlNominatedSection.style.display = "none";
        if (nominatedInfo) nominatedInfo.style.display = "none";
      } else {
        if (nominationSection) nominationSection.style.display = "block";
        if (controlNominatedSection) controlNominatedSection.style.display = "block";
        if (nominatedInfo) nominatedInfo.style.display = "flex";
      }

      const shotsInfo = document.getElementById("shots-info");
  const sheriffInfo = document.getElementById("sheriff-info");
      const donInfo = document.getElementById("don-info");


  const applyClasses = (elementId, dataArray, title) => {
      const element = document.getElementById(elementId);
      if (element) {
          element.innerHTML = ""; 

          if (dataArray.length > 0) {
              const container = document.createElement("div");
              container.className = "info-container";

            
              if (title.startsWith("<svg")) {
                  container.innerHTML = title;
              } else {
                  const titleElement = document.createElement("h3");
                  titleElement.textContent = title;
                  container.appendChild(titleElement);
              }

              
              const playersContainer = document.createElement("div");
              playersContainer.className = "players-list";

            
              dataArray.forEach(num => {
                  const player = this.players.find(p => p.number === num);
                  const roleClass = player ? this.getRoleClass(player.role) : "";

                  const playerDiv = document.createElement("div");
                  playerDiv.className = roleClass;
                  playerDiv.textContent = num === "-" ? "—" : num; 

                  playersContainer.appendChild(playerDiv);
              });

    
              container.appendChild(playersContainer);
              element.appendChild(container);
              element.style.display = "flex";
          } else {
              element.style.display = "none";
          }
    }
    const rolesHidden = localStorage.getItem("rolesHidden") === "true";
    if (rolesHidden) {
      document.querySelectorAll(".role").forEach(role => {
        role.style.visibility = "hidden";
      });
    }
  };
      applyClasses("shots-info", this.shots, "Відстріл");
applyClasses("sheriff-info", this.sheriffChecks, "Перевірка Шерифа");
applyClasses("don-info", this.donChecks, "Перевірка Дона");
      applyClasses("voted-info", JSON.parse(localStorage.getItem("votingHistory")) || [], `<svg class="actions-svg" width="22px" height="22px">
                  <use href="./img/sprite.svg#icon-voted"></use>
                </svg>`);
  applyClasses("nominated-info", this.nominated, "Виставлені");



      
      this.shots = JSON.parse(localStorage.getItem("mafiaShots") || "[]");
  this.donChecks = JSON.parse(localStorage.getItem("mafiaDonChecks") || "[]");
  this.sheriffChecks = JSON.parse(localStorage.getItem("mafiaSheriffChecks") || "[]");

  if (shotsInfo) {
    shotsInfo.innerHTML = `<svg class="actions-svg" width="28px" height="28px">
                  <use href="./img/sprite.svg#icon-killed"></use>
                </svg>` +
      (this.shots.length > 0 ? this.shots.map(num => {
        const player = this.players.find(p => p.number === num);
        const roleClass = player ? this.getRoleClass(player.role) : "";
        return `<div class="${roleClass}">${num}</div>`;
      }).join("") : "");
  }


  if (sheriffInfo) {
    sheriffInfo.innerHTML = `<svg class="actions-svg" width="22px" height="22px">
                  <use href="./img/sprite.svg#icon-sheriff"></use>
                </svg>` +
      (this.sheriffChecks.length > 0 ? this.sheriffChecks.map(num => {
        const player = this.players.find(p => p.number === num);
        const roleClass = player ? this.getRoleClass(player.role) : "";
        return `<div class="${roleClass}">${num}</div>`;
      }).join("") : "");
  }


  if (donInfo) {
    donInfo.innerHTML = `<svg class="actions-svg" width="26px" height="26px">
                  <use href="./img/sprite.svg#icon-hat"></use>
                </svg>` +
      (this.donChecks.length > 0 ? this.donChecks.map(num => {
        const player = this.players.find(p => p.number === num);
        const roleClass = player ? this.getRoleClass(player.role) : "";
        return `<div class="${roleClass}">${num}</div>`;
      }).join("") : "");
  }    
        }
        
    initControlPanel() {
      const panel = document.createElement("div");
      panel.id = "mafia-control-panel";

      panel.innerHTML = `
        <h3>Налаштування гри</h3>
        <div id="game-number-div">
          Номер гри: <input type="number" id="game-number-input" min="1" value="${localStorage.getItem("gameNumber") || 1}">
        </div>
        <div id="judge-name-div">
          Суддя столу: <input type="text" id="judge-name-input" placeholder="Введіть нік судді" value="${localStorage.getItem("mafiaJudge") || ""}">
        </div>
        <div id="player-setup"></div>
        <button id="start-game-button" onclick="mafiaGame.startGame()">Почати гру</button>
        <div id="game-controls" style="display:none;">
          <h3>Гра №<span id="game-number-control">${localStorage.getItem("gameNumber") || 1}</span></h3>
          <button class="next-phase" onclick="mafiaGame.nextPhase()">Змінити фазу</button>
          <button id="toggle-roles-button" onclick="mafiaGame.toggleRoles()">Сховати ролі</button>
          <button id="back-button" onclick="mafiaGame.goBack()">Назад</button>
          <button id="end-game-button" onclick="mafiaGame.endGame()">Закінчити гру</button>
          <p>Поточна фаза: <span id="game-phase-control">${localStorage.getItem("gamePhase") || "setup"}</span></p>
          <div id="role-selection" style="display:none;"></div>
          <div id="game-actions">
            <button id="no-vote-button" onclick="mafiaGame.addNoVoted()" style="display:none;">Нікого не заголосували</button>
          </div>
          <div id="nomination-buttons"></div>
          <div id="control-nominated-info"></div>
          <div id="night-actions" style="display:none;">
            <h3>Нічна фаза</h3>
            <label>Відстріл: <input type="number" id="shot-input" min="1" max="10"></label>
            <label>Перевірка Дона: <input type="number" id="don-check-input" min="1" max="10"></label>
            <label>Перевірка Шерифа: <input type="number" id="sheriff-check-input" min="1" max="10"></label>
            <button class="night-action" onclick="mafiaGame.submitNightActions()">Ввести</button>
          </div>
        </div>
      `;

      document.body.appendChild(panel);

      this.renderPlayerSetup();
      this.renderNominationButtons();
      this.restoreGameState();
  }

       restoreGameState() {
    if (localStorage.getItem("gameStarted") === "true") {
        document.getElementById("start-game-button").style.display = "none";
        document.getElementById("player-setup").style.display = "none";
        document.getElementById("game-controls").style.display = "block";
        
        try {
            this.players = JSON.parse(localStorage.getItem("mafiaPlayers")) || [];
            this.nominated = JSON.parse(localStorage.getItem("mafiaNominated")) || [];
            this.shots = JSON.parse(localStorage.getItem("mafiaShots")) || [];
            this.donChecks = JSON.parse(localStorage.getItem("mafiaDonChecks")) || [];
            this.sheriffChecks = JSON.parse(localStorage.getItem("mafiaSheriffChecks")) || [];
        } catch (error) {
            console.error("Ошибка парсинга данных из localStorage:", error);
            this.players = [];
            this.nominated = [];
            this.shots = [];
            this.donChecks = [];
            this.sheriffChecks = [];
        }

        this.judge = localStorage.getItem("mafiaJudge") || "";
        this.phase = localStorage.getItem("gamePhase") || "setup";
        this.gameNumber = localStorage.getItem("gameNumber") || "1";
        
        document.getElementById("judge-name-input").value = this.judge;
        document.getElementById("game-number-input").value = this.gameNumber;
        document.getElementById("game-phase-control").innerText = this.phase;
        document.getElementById("game-number-control").innerText = this.gameNumber;
        
        this.renderRoleSelection();
    }
}




    renderNominationButtons() {
      const buttonsContainer = document.getElementById("nomination-buttons");
      buttonsContainer.innerHTML = "<h3>Виставлення гравців</h3>";
      for (let i = 1; i <= 10; i++) {
        const button = document.createElement("button");
        button.innerText = i;
        button.onclick = () => this.nominatePlayer(i);
        button.disabled = this.phase !== "day";
        buttonsContainer.appendChild(button);
      }
    }

    nominatePlayer(playerNumber) {
      if (this.phase === "day") {
        if (this.nominated.includes(playerNumber)) {
          this.nominated = this.nominated.filter(num => num !== playerNumber);
        } else {
          this.nominated.push(playerNumber);
        }
        localStorage.setItem("mafiaNominated", JSON.stringify(this.nominated));
        this.renderNominationButtons();
        this.updateOverlay();
      }
    }


    renderPlayerSetup() {
      const setupDiv = document.getElementById("player-setup");
      setupDiv.innerHTML = "";
      for (let i = 1; i <= 10; i++) {
        setupDiv.innerHTML += `
          <div>
            Гравець ${i}: <input type="text" id="player${i}-name" placeholder="Им'я">
          </div>
        `;
      } 
    }

    renderRoleSelection() {
      const roleDiv = document.getElementById("role-selection");
      roleDiv.style.display = "block";
      roleDiv.innerHTML = "";
      this.players.forEach(player => {
        roleDiv.innerHTML += `
      <div>
  ${player.number}. ${player.name} 
  <span class="role" onclick="mafiaGame.cycleRole(${player.number})">${player.role}</span> |
  <span class="status">${player.status}</span>
  <span class="control_fouls" onclick="mafiaGame.cycleFouls(${player.number})">
                      ${"!".repeat(player.fouls || 0)}
                  </span>
  <button class="D-button" onclick="mafiaGame.setStatus(${player.number}, 'deleted')">D</button>
  <button class="V-button" onclick="mafiaGame.setStatus(${player.number}, 'voted')" ${this.phase !== 'day' ? 'disabled' : ''}>V</button>
  </div>
  `;
      });

      const startButton = document.getElementById("start-game-button");
  if (localStorage.getItem("gameStarted") === "true" && startButton) {
      startButton.style.display = "none"; 
  }
    }

        startGame() {
      const startButton = document.getElementById("start-game-button");
      if (startButton) {
          startButton.style.display = "none";
      }

          localStorage.setItem("gameStarted", "true");
      localStorage.setItem("gamePhase", this.phase);
      localStorage.setItem("mafiaPlayers", JSON.stringify(this.players));
      localStorage.setItem("mafiaJudge", this.judge);
      localStorage.setItem("gameNumber", this.gameNumber);
      
      document.getElementById("start-game-button").style.display = "none";
      document.getElementById("player-setup").style.display = "none";
      document.getElementById("game-controls").style.display = "block";
      
      this.renderRoleSelection();


      localStorage.removeItem("mafiaShots");
  localStorage.removeItem("mafiaDonChecks");
  localStorage.removeItem("mafiaSheriffChecks");
  localStorage.removeItem("mafiaNominated");
      localStorage.removeItem("mafiaVotedOut");
      localStorage.removeItem("votedPlayers");
      localStorage.removeItem("noVoted");
      localStorage.removeItem("votingHistory");

  this.shots = [];
  this.donChecks = [];
  this.sheriffChecks = [];
  this.nominated = [];
  this.votedOut = [];

      this.gameNumber = document.getElementById("game-number-input").value || "1";
      localStorage.setItem("gameNumber", this.gameNumber);
      this.judge = document.getElementById("judge-name-input").value || "";
      localStorage.setItem("mafiaJudge", this.judge);
      document.getElementById("judge-name-input").disabled = true;
      this.players = [];
      for (let i = 1; i <= 10; i++) {
        const name = document.getElementById(`player${i}-name`).value || `Гравець ${i}`;
        this.players.push({ number: i, name, role: "civilian", status: "alive", fouls: 0 });
      }
      localStorage.setItem("mafiaPlayers", JSON.stringify(this.players));
      document.getElementById("player-setup").style.display = "none";
      document.getElementById("game-controls").style.display = "block";
      this.renderRoleSelection();
    }

  endGame() {
      localStorage.removeItem("mafiaPlayers");
      localStorage.removeItem("mafiaJudge");
      localStorage.removeItem("mafiaShots");
      localStorage.removeItem("mafiaSheriffChecks");
      localStorage.removeItem("mafiaDonChecks");
      localStorage.removeItem("mafiaNominated");
      localStorage.removeItem("mafiaVotedOut");
      localStorage.removeItem("votingHistory");
      localStorage.removeItem("gamePhase");
      localStorage.removeItem("gameNumber");
      localStorage.removeItem("gameStarted");

      this.players = [];
      this.shots = [];
      this.sheriffChecks = [];
      this.donChecks = [];
      this.nominated = [];
      this.votedOut = [];
      this.phase = "setup";
      this.gameNumber = 1;
      this.judge = "";
      this.firstNightPassed = false;

      document.getElementById("player-setup").style.display = "block";
      document.getElementById("game-controls").style.display = "none";

      document.getElementById("judge-name-input").disabled = false;
      document.getElementById("game-number-input").disabled = false;

      const startButton = document.getElementById("start-game-button");
      if (startButton) {
          startButton.style.display = "block";
      }

      this.renderPlayerSetup();
      this.updateOverlay();
  }
        
        
    cycleRole(playerNumber) {
      const player = this.players.find(p => p.number === playerNumber);
      let currentIndex = this.availableRoles.indexOf(player.role);
      
      for (let i = 1; i <= this.availableRoles.length; i++) {
        let nextRole = this.availableRoles[(currentIndex + i) % this.availableRoles.length];
        let roleCount = this.players.filter(p => p.role === nextRole).length;
        if (!this.roleLimits[nextRole] || roleCount < this.roleLimits[nextRole]) {
          player.role = nextRole;
          break;
        }
      }
      
      localStorage.setItem("mafiaPlayers", JSON.stringify(this.players));
      this.renderRoleSelection();
    }

    setStatus(playerNumber, status) {
      const player = this.players.find(p => p.number === playerNumber);
      if (!player) return;

      player.status = status;
      localStorage.setItem("mafiaPlayers", JSON.stringify(this.players));

      if (status === "voted") { 
          let votingHistory = JSON.parse(localStorage.getItem("votingHistory")) || [];
          votingHistory.push(playerNumber);
          localStorage.setItem("votingHistory", JSON.stringify(votingHistory));
      }

      this.renderRoleSelection();
      this.updateOverlay();
      localStorage.setItem("updateOverlay", Date.now()); 
  }


    addNoVoted() {
      let votingHistory = JSON.parse(localStorage.getItem("votingHistory")) || [];
      votingHistory.push("X"); 
      localStorage.setItem("votingHistory", JSON.stringify(votingHistory)); 

      this.updateOverlay(); 
      localStorage.setItem("updateOverlay", Date.now());
  }




    nextPhase() {
      this.nominated = [];
      localStorage.setItem("mafiaNominated", JSON.stringify(this.nominated));
      this.phase = this.phase === "day" ? "night" : "day";
    
      document.getElementById("game-phase-control").innerText = this.phase;
      localStorage.setItem("gamePhase", this.phase);
      this.renderRoleSelection();
      this.renderNominationButtons();
      const judgeInput = document.getElementById("judge-name-div");
      const gameNumberInput = document.getElementById("game-number-div");

      if (this.phase === "setup") {
        if (judgeInput) judgeInput.style.display = "block";
        if (gameNumberInput) gameNumberInput.style.display = "block";
      } else {
        if (judgeInput) judgeInput.style.display = "none";
        if (gameNumberInput) gameNumberInput.style.display = "none";
      }

      const nightActions = document.getElementById("night-actions");
      if (nightActions) nightActions.style.display = this.phase === "night" ? "block" : "none";
      
      this.updateOverlay();
    }

    submitNightActions() {
      if (this.phase !== "night") return;

      const shot = document.getElementById("shot-input").value.trim();
      const donCheck = document.getElementById("don-check-input").value.trim();
      const sheriffCheck = document.getElementById("sheriff-check-input").value.trim();

      this.shots.push(shot ? parseInt(shot, 10) : "X");
      this.donChecks.push(donCheck ? parseInt(donCheck, 10) : "X");
      this.sheriffChecks.push(sheriffCheck ? parseInt(sheriffCheck, 10) : "X");

      let firstKilledPlayer = null;
let killedPlayers = [];

this.shots.forEach(num => {
    const player = this.players.find(p => p.number === num);
    if (player && player.status !== "killed") {
        player.status = "killed";
        killedPlayers.push(player); 
    }
});

if (!this.firstNightPassed && killedPlayers.length > 0) {
    firstKilledPlayer = killedPlayers[0]; 
    console.log("⚡ Вызов showNumberSelectionModal для", firstKilledPlayer.number);
    this.showNumberSelectionModal(firstKilledPlayer);
    this.firstNightPassed = true;
}



      localStorage.setItem("mafiaPlayers", JSON.stringify(this.players));
      localStorage.setItem("mafiaShots", JSON.stringify(this.shots));
      localStorage.setItem("mafiaDonChecks", JSON.stringify(this.donChecks));
      localStorage.setItem("mafiaSheriffChecks", JSON.stringify(this.sheriffChecks));
      localStorage.setItem("updateOverlay", Date.now());

      document.getElementById("shot-input").value = "";
      document.getElementById("don-check-input").value = "";
      document.getElementById("sheriff-check-input").value = "";

      this.updateOverlay();

  }





    getRoleClass(role) {
      return role === "mafia" ? "mafia-num" :
            role === "civilian" ? "civilian-num" :
            role === "sheriff" ? "sheriff-num" :
            role === "don" ? "don-num" : "";
      
    }
    
    

  cycleFouls(playerNumber) {
      const player = this.players.find(p => p.number === playerNumber);
      if (!player) return;

      player.fouls = (player.fouls || 0) + 1;  
      if (player.fouls > 3) player.fouls = 0; 

      console.log(`Фолы игрока ${playerNumber}:`, player.fouls); 

      localStorage.setItem("mafiaPlayers", JSON.stringify(this.players));

      this.renderRoleSelection();  
      this.updateOverlay();       
  }



    toggleRoles() {
      const roleElements = document.querySelectorAll(".role");
      const button = document.getElementById("toggle-roles-button");

      if (roleElements.length === 0) return;

    
      const isHidden = roleElements[0].style.visibility === "hidden";

    
      roleElements.forEach(role => {
          role.style.visibility = isHidden ? "visible" : "hidden";
      });

       localStorage.setItem("rolesHidden", isHidden ? "false" : "true");
    
      button.innerText = isHidden ? "Сховати ролі" : "Показати ролі";
    }
    
       
    showNumberSelectionModal(killedPlayer) {
      const modal = document.createElement("div");
      modal.id = "number-selection-modal";
      modal.innerHTML = `
          <h3>Оберіть 3 номери</h3>
          <div id="number-buttons"></div>
          <button id="submit-numbers">Затвердити</button>
          <button id="skip-numbers">Пропустити</button>
      `;
      document.body.appendChild(modal);

      const numberButtonsDiv = document.getElementById("number-buttons");
      let selectedNumbers = [];

      for (let i = 1; i <= 10; i++) {
          const button = document.createElement("button");
          button.innerText = i;
          button.onclick = () => {
              if (selectedNumbers.includes(i)) {
                  selectedNumbers = selectedNumbers.filter(num => num !== i);
                  button.style.background = "";
              } else if (selectedNumbers.length < 3) {
                  selectedNumbers.push(i);
                  button.style.background = "lightblue";
              }
          };
          numberButtonsDiv.appendChild(button);
      }

      document.getElementById("submit-numbers").onclick = () => {
          console.log("Обрані номери:", selectedNumbers);
          this.saveBestMove(killedPlayer, selectedNumbers);
          modal.remove();
      };

      document.getElementById("skip-numbers").onclick = () => {
          console.log("Пропущено");
          this.saveBestMove(killedPlayer, []);
          modal.remove();
      };
  }
  saveBestMove(killedPlayer, selectedNumbers) {
    localStorage.setItem(`bestMove-${killedPlayer.number}`, JSON.stringify(selectedNumbers));

    
    this.players.forEach(player => {
        if (player.number !== killedPlayer.number) {
            localStorage.removeItem(`bestMove-${player.number}`);
        }
    });

    this.updateOverlay();
}

      

  }

  const mafiaGame = new MafiaOverlay();