document.addEventListener("DOMContentLoaded", () => {
    const fixtureTable = document.getElementById("fixtureTable");
    const standingsTable = document.getElementById("standingsTable").querySelector("tbody");
    const resultForm = document.getElementById("resultForm");
    const adminSection = document.getElementById("admin-section");
    const team1Select = document.getElementById("team1");
    const team2Select = document.getElementById("team2");
    const championDiv = document.getElementById("championDiv");
    const championName = document.getElementById("championName");
    const newTournamentButton = document.getElementById("newTournamentButton");
    const tournamentsContainer = document.getElementById("tournamentsContainer");

    // Autenticación simple para Román
    const userName = prompt("Password:");
    if (userName === "1983") {
        adminSection.style.display = "block"; // Mostrar sección admin si el usuario es Román
    }

    let tournamentSaved = false; // Variable para rastrear si el torneo ha sido guardado

    const loadResults = () => {
        const results = JSON.parse(localStorage.getItem("fixtureResults")) || {};
        updateFixtureTable(results);
        updateStandingsTable(results);
        displayTournaments(); // Carga los torneos al cargar la página
    };

    const updateFixtureTable = (results) => {
        const teams = ["Pablo", "Fede", "Willy", "Roma"];
        fixtureTable.innerHTML = `
        <tr class='border-b border-gray-300'>
            <th style='background: #000;'></th>
            ${teams.map((team, index) => `<th class='${index < teams.length - 1 ? 'border-r border-gray-300' : ''}'>${team}</th>`).join("")}
        </tr>
        ${teams.map((team1, index) => `
            <tr class='${index < 3 ? 'border-b border-gray-300' : ''}'>
                <th class='text-left pl-2 border-r border-gray-300'>${team1}</th>
                ${teams.map(team2 => {
            if (team1 === team2) return "<td style='background: #000;'></td>"; // Mismo equipo
            const matchResult1 = results[`${team1}-${team2}`];
            const matchResult2 = results[`${team2}-${team1}`];
            if (matchResult1) {
                const { score1, score2 } = matchResult1;
                if (score1 > score2) return "<td class='text-center border-r border-gray-300'>&#11093</td>"; // team1 gana
                if (score1 < score2) return "<td class='text-center border-r border-gray-300'>&#10006</td>"; // team2 gana
                return "<td class='text-center border-r border-gray-300'>&#9651;</td>"; // Empate
            } else if (matchResult2) {
                const { score1, score2 } = matchResult2;
                if (score1 > score2) return "<td class='text-center border-r border-gray-300'>&#10006</td>"; // team1 pierde
                if (score1 < score2) return "<td class='text-center border-r border-gray-300'>&#11093</td>"; // team2 pierde
                return "<td class='text-center border-r border-gray-300'>&#9651;</td>"; // Empate
            }
            return "<td class='text-center border-r border-gray-300'></td>"; // No hay resultado
        }).join("")}
            </tr>
        `).join("")}
    `;
    };



    const calculateStandings = (results) => {
        const teams = ["Pablo", "Fede", "Willy", "Roma"];
        const standings = teams.map(team => ({ name: team, GF: 0, GC: 0, PTS: 0 }));

        for (const [match, result] of Object.entries(results)) {
            const [team1, team2] = match.split("-");
            const score1 = result.score1;
            const score2 = result.score2;

            const team1Data = standings.find(t => t.name === team1);
            const team2Data = standings.find(t => t.name === team2);

            team1Data.GF += score1;
            team1Data.GC += score2;
            team2Data.GF += score2;
            team2Data.GC += score1;

            if (score1 > score2) {
                team1Data.PTS += 3; // team1 wins
            } else if (score1 < score2) {
                team2Data.PTS += 3; // team2 wins
            } else {
                team1Data.PTS += 1; // Draw
                team2Data.PTS += 1;
            }
        }

        standings.sort((a, b) => b.PTS - a.PTS || (b.GF - b.GC) - (a.GF - a.GC));
        return standings;
    };

    const updateStandingsTable = (results) => {
        const standings = calculateStandings(results);
        standingsTable.innerHTML = standings.map((team, index) => `
        <tr class='${index < standings.length - 1 ? 'border-b border-gray-300' : ''}'>
            <td class='text-center  border-r border-gray-300'>${team.name}</td>
            <td class='text-center border-r border-gray-300'>${team.GF}</td>
            <td class='text-center border-r border-gray-300'>${team.GC}</td>
            <td class='text-center'>${team.PTS}</td>
        </tr>
    `).join("");

        // Verificar si hay campeón solo si todos los partidos han sido completados
        const allMatchesCompleted = Object.keys(results).length === 6; // Hay 6 partidos en total
        const champion = standings[0];
        if (allMatchesCompleted && champion && champion.PTS > 0) {
            championName.textContent = champion.name;
            championDiv.style.display = "block"; // Mostrar campeón
            if (!tournamentSaved) { // Solo guardar si no ha sido guardado
                saveTournamentIfNew(champion.name, standings);
                tournamentSaved = true; // Marcar como guardado
            }
        } else {
            championDiv.style.display = "none"; // Ocultar campeón si no se cumplen condiciones
        }

        // Mostrar botón para iniciar nuevo torneo solo si hay un campeón
        newTournamentButton.style.display = allMatchesCompleted ? "block" : "none";
    };


    const saveTournamentIfNew = (championName, standings) => {
        const tournaments = JSON.parse(localStorage.getItem("tournaments")) || [];
        const tournamentData = {
            id: Date.now(), // Agregar un ID único
            champion: championName,
            standings: standings,
            date: new Date().toLocaleString(),
        };

        // Verificar si el torneo ya existe
        const tournamentExists = tournaments.some(tournament =>
            tournament.champion === championName && tournament.date === tournamentData.date
        );

        if (!tournamentExists) {
            tournaments.push(tournamentData);
            localStorage.setItem("tournaments", JSON.stringify(tournaments));
            displayTournaments(); // Llamar a displayTournaments después de guardar
        }
    };

    const displayTournaments = () => {
        const tournaments = JSON.parse(localStorage.getItem("tournaments")) || []; // Cargar torneos
        tournamentsContainer.innerHTML = tournaments.map((tournament, index) => `
            <div class='m-1 text-center 'text-xl'>
                <h1 class='text-9xl font-bold' >Campeón: ${tournament.champion}</h1>
                <h3>Torneo ${index + 1}: ${tournament.date}</h3>
                <table border="1" style="width: 100%; text-align: center;">
                    <thead>
                        <tr>
                            <th>Equipo</th>
                            <th>GF</th>
                            <th>GC</th>
                            <th>PTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tournament.standings.map(team => `
                            <tr>
                                <td>${team.name}</td>
                                <td>${team.GF}</td>
                                <td>${team.GC}</td>
                                <td>${team.PTS}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `).join("");
    };

    resultForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const team1 = team1Select.value;
        const team2 = team2Select.value;
        const score1 = parseInt(document.getElementById("score1").value, 10);
        const score2 = parseInt(document.getElementById("score2").value, 10);

        if (team1 && team2 && team1 !== team2) {
            const results = JSON.parse(localStorage.getItem("fixtureResults")) || {};
            results[`${team1}-${team2}`] = { score1, score2 };
            localStorage.setItem("fixtureResults", JSON.stringify(results));
            updateFixtureTable(results);
            updateStandingsTable(results);
            resultForm.reset();
        } else {
            alert("Selecciona equipos válidos y diferentes.");
        }
    });

    newTournamentButton.addEventListener("click", () => {
        localStorage.removeItem("fixtureResults"); // Limpiar resultados del torneo anterior
        tournamentSaved = false; // Reiniciar la variable de guardado
        loadResults(); // Recargar resultados y torneos
    });

    loadResults(); // Cargar los resultados y torneos al inicio

    
});


