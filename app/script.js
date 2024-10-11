const poolData = {
    UserPoolId: 'eu-west-2_XFkeu36CN', // e.g. 'eu-west-2_aBc123',
    ClientId: 'ndk88i04ltkr5tdjqv8748smu'   // e.g. 'abc123def456ghi789jkl0'
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
let cognitoUser;

// Sign Up function
function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value; // New name input field

    const attributeList = [
        new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: email }),
        new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'name', Value: name }) // Include name attribute
    ];

    userPool.signUp(email, password, attributeList, null, (err, result) => {
        if (err) {
            alert(err.message || JSON.stringify(err));
            return;
        }
        alert("User registered successfully!");
        console.log(result);
    });
}

function confirmUser() {
    const email = document.getElementById('email').value;
    const confirmationCode = document.getElementById('confirmationCode').value; // Code input field

    const userData = {
        Username: email,
        Pool: userPool
    };

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.confirmRegistration(confirmationCode, true, (err, result) => {
        if (err) {
            alert(err.message || JSON.stringify(err));
            return;
        }
        alert('User confirmed successfully!');
        console.log(result);
    });
}

// Sign In function
function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: email,
        Password: password,
    });

    const userData = { Username: email, Pool: userPool };
    cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
            console.log('Login successful');
            alert('Login successful!');
            document.getElementById('new-post').style.display = 'block';
            fetchBlogPosts();
        },
        onFailure: (err) => {
            alert(err.message || JSON.stringify(err));
        }
    });
}

// Sign Out function
function signOut() {
    if (cognitoUser) {
        cognitoUser.signOut();
        alert("Signed out successfully");
        document.getElementById('new-post').style.display = 'none';
    }
}

// Adding event listeners for buttons
document.getElementById('signin').addEventListener('click', signIn);
document.getElementById('signup').addEventListener('click', signUp);
document.getElementById('signout').addEventListener('click', signOut);

// API URL for Blog Posts
const apiUrl = 'https://fkf8anus5e.execute-api.eu-west-2.amazonaws.com/poqpoq/blogposts'; // Replace with your API Gateway URL

// Fetch and display blog posts from the API
async function fetchBlogPosts() {
    try {
        // Get the current session from Cognito
        const session = await getSession();
        const token = session.getIdToken().getJwtToken(); // Get the Cognito ID token

        const headers = {
            Authorization: token,
            'Content-Type': 'application/json',
            // Optional, but good to include
        };
        // Make the GET request to the API, passing the headers
        const response = await fetch(apiUrl, {
            method: 'GET',// Specify the method as GET
            headers: headers // Pass the headers with the token
        });

        // Check if the response is OK
        if (!response.ok) {
            throw new Error('Failed to fetch blog posts');
        }

        // Parse the response as JSON
        const posts = await response.json();

        // Map the posts to the DOM
        document.getElementById('content').innerHTML = posts.map(post => `
            <article>
                <h2>${post.title}</h2>
                <p>${post.content}</p>
                <button onclick="deletePost('${post.id}')">Delete</button>
            </article>
        `).join('');

    } catch (error) {
        // Log and handle any errors
        console.error('Error fetching blog posts:', error);
    }
}


// Add new blog post
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const newPost = { title, content };
    const session = await getSession();
    const token = session.getIdToken().getJwtToken();

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token
            },
            body: JSON.stringify(newPost)
        });

        if (response.ok) {
            fetchBlogPosts();
            document.getElementById('postForm').reset();
        }
    } catch (error) {
        console.error('Error creating post:', error);
    }
});

// Delete a post
async function deletePost(postId) {
    const session = await getSession();
    const token = session.getIdToken().getJwtToken();

    try {
        const response = await fetch(`${apiUrl}/${postId}`, {
            method: 'DELETE',
            headers: { Authorization: token }
        });
        if (response.ok) {
            fetchBlogPosts();
        }
    } catch (error) {
        console.error('Error deleting post:', error);
    }
}

// Get current session
function getSession() {
    return new Promise((resolve, reject) => {
        cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.getSession((err, session) => {
                if (err || !session.isValid()) {
                    reject(err);
                } else {
                    resolve(session);
                }
            });
        } else {
            reject(new Error('No user logged in'));
        }
    });
}

// On page load, check if user is logged in and display posts
document.addEventListener('DOMContentLoaded', () => {
    getSession().then(session => {
        document.getElementById('new-post').style.display = 'block';
        fetchBlogPosts();
    }).catch(() => {
        console.log('No user session found');
    });
});

document.getElementById('signup').addEventListener('click', signUp);
document.getElementById('confirm').addEventListener('click', confirmUser);
