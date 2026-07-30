async function loadOfficers() {
  try {
    const response = await fetch("/NEAofficers");

    const officers = await response.json();

    const officerList = document.getElementById("officerList");

    officerList.innerHTML = "";

    officers.forEach((officer) => {
      officerList.innerHTML += `

            <tr>

                <td>${officer.OfficerName}</td>

                <td>${officer.OfficerID}</td>

                <td>${officer.OfficerContactNo}</td>

                <td>${officer.OfficerUsername}</td>

                <td>${officer.OfficerRoles}</td>

                <td>${officer.OfficerStatus}</td>

                <td>

<select id="status-${officer.OfficerUsername}" class="status-select">

<option value="Active">
Active
</option>

<option value="Inactive">
Inactive
</option>

<option value="Suspended">
Suspended
</option>

<option value="Resigned">
Resigned
</option>

</select>


<button
class="update-status-btn"
onclick="updateOfficerStatus('${officer.OfficerUsername}')">

Update Status

</button>


</td>


            </tr>

            `;
    });
  } catch (error) {
    console.log("Error loading officers:", error);

    document.getElementById("officerList").innerHTML = `
        <tr>
            <td colspan="6">
                Unable to load officer information
            </td>
        </tr>
        `;
  }
}
const darkButton = document.getElementById("darkModeBtn");
const greenButton = document.getElementById("greenModeBtn");

darkButton.addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");
});

greenButton.addEventListener("click", function () {
  document.body.classList.toggle("green-mode");
});

async function softDeleteOfficer(username) {
  const confirmDelete = confirm(
    "Are you sure you want to resign this officer?",
  );

  if (!confirmDelete) {
    return;
  }

  try {
    const response = await fetch(`/NEAofficers/${username}/status`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        OfficerStatus: "Resigned",
      }),
    });

    if (response.ok) {
      alert("Officer status updated to Resigned");

      loadOfficers();
    } else {
      alert("Failed to update officer status");
    }
  } catch (error) {
    console.log("Soft delete error:", error);

    alert("Unable to update officer");
  }
}

async function activateOfficer(username) {
  const confirmActivate = confirm("Activate this officer again?");

  if (!confirmActivate) {
    return;
  }

  try {
    const response = await fetch(`/NEAofficers/${username}/status`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        OfficerStatus: "Active",
      }),
    });

    if (response.ok) {
      alert("Officer activated successfully");

      loadOfficers();
    } else {
      alert("Failed to activate officer");
    }
  } catch (error) {
    console.log("Activation error:", error);

    alert("Unable to activate officer");
  }
}

async function updateOfficerStatus(username) {
  const selectedStatus = document.getElementById(`status-${username}`).value;

  const confirmUpdate = confirm(`Change officer status to ${selectedStatus}?`);

  if (!confirmUpdate) {
    return;
  }

  try {
    const response = await fetch(`/NEAofficers/${username}/status`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        OfficerStatus: selectedStatus,
      }),
    });

    if (response.ok) {
      alert("Officer status updated successfully");

      loadOfficers();
    } else {
      alert("Unable to update officer status");
    }
  } catch (error) {
    console.log("Status update error:", error);

    alert("Server error while updating status");
  }
}
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

// createOfficer();
// run automatically when page loads
loadOfficers();
