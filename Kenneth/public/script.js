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

document.querySelector("button").addEventListener("click", () => {
  console.log("Button clicked");
  createOfficer();
});

async function createOfficer() {
  const officerData = {
    OfficerName: document.getElementById("name").value,
    OfficerUsername: document.getElementById("username").value,
    OfficerPassword: document.getElementById("password").value,
    OfficerContactNo: document.getElementById("contact-number").value,
    OfficerRoles: document.getElementById("role").value,
    OfficerStatus: document.getElementById("create-status").value,
  };

  console.log(officerData);

  const officerList = document.getElementById("officerList");

  officerList.append(` 
                    ${officerData.OfficerName}\n\n
                    
                   \n\n\t
                    ID: ${officerData.OfficerID}\n\n
                

                    \n\n\t
                    Contact: ${officerData.OfficerContactNo}\n\n
                  

                  \n\n\t
                    Username: ${officerData.OfficerUsername}\n\n
                 

                    \n\n\t
                    Role: ${officerData.OfficerRoles}\n\n
                    
                  \n\n\t
                    Status: ${officerData.OfficerStatus}\n\n
                  

                   
  `);
  element.append(" \n\n\t");
}

// Attach to button
//document.querySelector("button").addEventListener("click", createOfficer);

// run automatically when page loads
loadOfficers();
createOfficer();
loadOfficers();
