const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
const breachAPI = 'https://api.pwnedpasswords.com/range/';

function showGeneratePassword() {
    document.getElementById('generatePassword').style.display = 'block';
    document.getElementById('checkPassword').style.display = 'none';
    document.getElementById('passwordSuggestions').style.display = 'none';
}

function showCheckPassword() {
    document.getElementById('generatePassword').style.display = 'none';
    document.getElementById('checkPassword').style.display = 'block';
    document.getElementById('passwordSuggestions').style.display = 'none';
}

function generatePassword() {
    let length = document.getElementById('passwordLength').value || 16;
    let password = '';
    for (let i = 0; i < length; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const passwordOutput = document.getElementById('generatedPassword');
    passwordOutput.innerText = `Generated Password: ${password}`;
    passwordOutput.style.display = 'block';

    // Show the copy button after generating the password
    document.getElementById('copyPassword').style.display = 'inline-block';
}

async function checkPassword() {
    const password = document.getElementById('passwordInput').value;
    const sha1Hash = sha1(password);
    const prefix = sha1Hash.slice(0, 5);
    const suffix = sha1Hash.slice(5);

    try {
        const response = await fetch(`${breachAPI}${prefix}`);
        const data = await response.text();
        const lines = data.split('\n');
        let found = false;

        lines.forEach(line => {
            const [hashSuffix, count] = line.split(':');
            if (hashSuffix === suffix) {
                found = true;
                showBreachResults(count);
            }
        });

        if (!found) {
            showSafePassword();
        }
    } catch (error) {
        console.error("Error checking password:", error);
        alert("Error checking password.");
    }
}

async function showBreachResults(count) {
    document.getElementById('passwordCheckResult').innerText = `Password found in ${count} breaches!`;
    document.getElementById('passwordCheckResult').style.display = 'block';
    document.getElementById('passwordSuggestions').style.display = 'block';

    const suggestions = await suggestMemorableAlternatives(document.getElementById('passwordInput').value);
    const suggestionsList = document.getElementById('suggestionsList');
    suggestionsList.innerHTML = '';

    suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;

        // Add a copy button styled as small logo at the right-most side of the <li>
        const copyButton = document.createElement('button');
        copyButton.innerText = 'Copy'; // Text on the button
        copyButton.classList.add('copy-btn'); // Add the copy button class
        copyButton.onclick = () => copyPassword(suggestion);

        // Append the copy button to the list item
        li.appendChild(copyButton);
        suggestionsList.appendChild(li);
    });
}

function showSafePassword() {
    document.getElementById('passwordCheckResult').innerText = "Password not found in any breaches.";
    document.getElementById('passwordCheckResult').style.display = 'block';
}

async function suggestMemorableAlternatives(password) {
    const additions = ["123", "!@#", "2024", "ABC", "789", "&*%", "xyz", "_plus", "#Safe", "$Alt"];
    let suggestions = [];

    // Loop through additions and check if each new password is leaked
    for (let addition of additions) {
        const suggestion = password + addition;
        const isLeaked = await checkIfLeaked(suggestion);
        if (!isLeaked) {
            suggestions.push(suggestion);
        }
    }

    return suggestions;
}

async function checkIfLeaked(password) {
    const sha1Hash = sha1(password);
    const prefix = sha1Hash.slice(0, 5);
    const suffix = sha1Hash.slice(5);
    let found = false;

    try {
        const response = await fetch(`${breachAPI}${prefix}`);
        const data = await response.text();
        const lines = data.split('\n');

        lines.forEach(line => {
            const [hashSuffix, count] = line.split(':');
            if (hashSuffix === suffix) {
                found = true;
            }
        });
    } catch (error) {
        console.error("Error checking if password is leaked", error);
    }

    return found;
}

function sha1(str) {
    return CryptoJS.SHA1(str).toString(CryptoJS.enc.Hex).toUpperCase();
}

function copyPassword(password) {
    // Create a temporary textarea element to hold the password
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = password;

    // Append the textarea to the body (it won't be visible to the user)
    document.body.appendChild(tempTextArea);

    // Select and copy the password text from the textarea
    tempTextArea.select();
    tempTextArea.setSelectionRange(0, 99999); // For mobile devices

    try {
        // Execute the copy command
        document.execCommand('copy');

        // Show the "Password copied!" confirmation
        const confirmationMessage = document.getElementById('copyConfirmation');
        confirmationMessage.style.display = 'block';

        // Hide the confirmation message after 2 seconds
        setTimeout(() => {
            confirmationMessage.style.display = 'none';
        }, 2000);
    } catch (err) {
        console.error('Error copying password: ', err);
    }

    // Remove the temporary textarea from the DOM
    document.body.removeChild(tempTextArea);
}
