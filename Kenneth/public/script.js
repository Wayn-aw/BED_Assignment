async function loadOfficers() {
  try {
    const response = await fetch("/NEAofficers");

    const officers = await response.json();

    const officerList = document.getElementById("officerList");

    //console.log(officerList);

    officerList.innerHTML = "";

    officers.forEach((officer) => {
      officerList.innerHTML += `
                <div>
                    <h3>${officer.OfficerName}</h3>

                    <p>
                    ID: ${officer.OfficerID}
                    </p>

                    <p>
                    Contact: ${officer.OfficerContactNo}
                    </p>

                    <p>
                    Username: ${officer.OfficerUsername}
                    </p>

                    <p>
                    Role: ${officer.OfficerRoles}
                    </p>

                    <p>
                    Status: ${officer.OfficerStatus}
                    </p>

                    <hr>
                </div>
            `;
    });
  } catch (error) {
    console.log("Error loading officers:", error);
  }
}

// run automatically when page loads
loadOfficers();
