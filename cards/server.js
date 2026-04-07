const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const url = process.env.MONGODB_URI;
const client = new MongoClient(url);
client.connect();

const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

const options = {
	key: fs.readFileSync('/etc/letsencrypt/live/springucfpoosdap.com/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/springucfpoosdap.com/fullchain.pem')
};

/*
app.use((req, res, next) => 
{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    next();
});
*/

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', 'https://springucfpoosdap.com');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	next();
})

const PORT = process.env.PORT || 5000;
https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
	console.log(`Server running on port ${PORT}`);
});


var cardList =
[
'Roy Campanella',
'Paul Molitor',
'Tony Gwynn',
'Dennis Eckersley',
'Reggie Jackson',
'Gaylord Perry',
'Buck Leonard',
'Rollie Fingers',
'Charlie Gehringer',
'Wade Boggs',
'Carl Hubbell',
'Dave Winfield',
'Jackie Robinson',
'Ken Griffey, Jr.',
'Al Simmons',
'Chuck Klein',
'Mel Ott',
'Mark McGwire',
'Nolan Ryan',
'Ralph Kiner',
'Yogi Berra',
'Goose Goslin',
'Greg Maddux',
'Frankie Frisch',
'Ernie Banks',
'Ozzie Smith',
'Hank Greenberg',
'Kirby Puckett',
'Bob Feller',
'Dizzy Dean',
'Joe Jackson',
'Sam Crawford',
'Barry Bonds',
'Duke Snider',
'George Sisler',
'Ed Walsh',
'Tom Seaver',
'Willie Stargell',
'Bob Gibson',
'Brooks Robinson',
'Steve Carlton',
'Joe Medwick',
'Nap Lajoie',
'Cal Ripken, Jr.',
'Mike Schmidt',
'Eddie Murray',
'Tris Speaker',
'Al Kaline',
'Sandy Koufax',
'Willie Keeler',
'Pete Rose',
'Robin Roberts',
'Eddie Collins',
'Lefty Gomez',
'Lefty Grove',
'Carl Yastrzemski',
'Frank Robinson',
'Juan Marichal',
'Warren Spahn',
'Pie Traynor',
'Roberto Clemente',
'Harmon Killebrew',
'Satchel Paige',
'Eddie Plank',
'Josh Gibson',
'Oscar Charleston',
'Mickey Mantle',
'Cool Papa Bell',
'Johnny Bench',
'Mickey Cochrane',
'Jimmie Foxx',
'Jim Palmer',
'Cy Young',
'Eddie Mathews',
'Honus Wagner',
'Paul Waner',
'Grover Alexander',
'Rod Carew',
'Joe DiMaggio',
'Joe Morgan',
'Stan Musial',
'Bill Terry',
'Rogers Hornsby',
'Lou Brock',
'Ted Williams',
'Bill Dickey',
'Christy Mathewson',
'Willie McCovey',
'Lou Gehrig',
'George Brett',
'Hank Aaron',
'Harry Heilmann',
'Walter Johnson',
'Roger Clemens',
'Ty Cobb',
'Whitey Ford',
'Willie Mays',
'Rickey Henderson',
'Babe Ruth'
];

app.post('/api/addcard', async (req, res, next) =>
{
    // incoming: userId, color
    // outgoing: error

    const { userId, card } = req.body;

    const newCard = {Card:card,UserId:userId};
    var error = '';

    try
    {
        const db = client.db('COP4331Cords');
        const result = await db.collection('Cards').insertOne(newCard);
    }
    catch(e)
    {
        error = e.toString();
    }

    cardList.push( card );

    var ret = { error: error };
    res.status(200).json(ret);
});

app.post('/api/signup', async (req, res, next) => {
    // incoming: firstName, lastName, login, password
    // outgoing: error

    const { firstName, lastName, login, password } = req.body;
    var error = '';

    // ensure fields are not empty
    if (!firstName || !lastName || !login || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // enforce password length requirement
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    try {
        const db = client.db('COP4331Cords');
        
        // check if user already exists to prevent duplicates
        const existingUser = await db.collection('Users').findOne({ Login: login });
        if (existingUser) {
            return res.status(409).json({ error: 'Username already taken.' });
        }

        // hashing password
        const saltRounds = 10; // hashing iterations of 2^10
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // creating user object
        const newUser = {
            FirstName: firstName,
            LastName: lastName,
            Login: login,
            Password: hashedPassword,
            Captures: 0 // tracks birds identified by user
        };

        // insert into the database
        await db.collection('Users').insertOne(newUser);
        
    } catch(e) {
        error = e.toString();
        return res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }

    res.status(200).json({ error: error });
});

app.post('/api/login', async (req, res, next) => {
    // incoming: login, password
    // outgoing: id, firstName, lastName, error

    var error = '';
    const { login, password } = req.body;
    var id = -1;
    var fn = '';
    var ln = '';

    try {
        const db = client.db('COP4331Cords');
        
        // find user by login
        const user = await db.collection('Users').findOne({ Login: login });

        if (user) {
            // compare provided password with hashed password in database
            const isMatch = await bcrypt.compare(password, user.Password);

            // if successful, return user info
            if (isMatch) {
                id = user._id;
                fn = user.FirstName;
                ln = user.LastName;
            } else {
                error = 'Invalid user name/password';
            }
        } else {
            error = 'Invalid user name/password';
        }
    } catch(e) {
        error = e.toString();
    }

    var ret = { id: id, firstName: fn, lastName: ln, error: error };
    res.status(200).json(ret);
});

app.post('/api/searchcards', async (req, res, next) =>
{
    // incoming: userId, search
    // outgoing: results[], error

    var error = '';

    const { userId, search } = req.body;

    var _search = search.trim();

    const db = client.db('COP4331Cords');
    const results = await db.collection('Cards').find({"Card":{$regex:_search+'.*', $options:'i'}}).toArray();

    var _ret = [];
    for( var i=0; i<results.length; i++ )
    {
        _ret.push( results[i].Card );
    }

    var ret = {results:_ret, error:error};
    res.status(200).json(ret);
});

app.post('/api/searchbirds', async (req, res, next) => {
    // incoming: search
    // outgoing: results[], error

    var error = '';
    const { search } = req.body;
    var _search = search.trim();

    try {
        const db = client.db('COP4331Cords');
        
        // Searches the 'Birds' collection by a field named 'Name'. 
        const results = await db.collection('Birds').find({ "Name": { $regex: _search + '.*', $options: 'i' } }).toArray();

        var _ret = [];
        for (var i = 0; i < results.length; i++) {
            _ret.push(results[i]); 
        }

        res.status(200).json({ results: _ret, error: error });
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});

app.use(express.static('/var/www/html'));
app.get('*', (req, res) => {
	res.sendFile(path.join('/var/www/html', 'index.html'));
});

async function start() {
  try {
    await client.connect();
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Mongo connect error code=', err && err.code, 'errno=', err && err.errno);
    console.error(err);
    process.exit(1);
  }

  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await client.close();
    server.close(() => process.exit(0));
  });
}

start();