const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const url = process.env.MONGODB_URI;
const client = new MongoClient(url);
client.connect();

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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

app.use((req, res, next) => 
{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    next();
});

app.post('/api/addcard', async (req, res, next) =>
{
    // incoming: userId, color
    // outgoing: error

    const { userId, card } = req.body;

    const newCard = {Card:card,UserId:userId};
    var error = '';

    try
    {
        const db = client.db('COP4331Cards');
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

app.post('/api/login', async (req, res, next) =>
{
// incoming: login, password
// outgoing: id, firstName, lastName, error
var error = '';
const { login, password } = req.body;
var id = -1;
var fn = '';
var ln = '';
if( login.toLowerCase() == 'rickl' && password == 'COP4331' )
{
id = 1;
fn = 'Rick';
ln = 'Leinecker';
}
else
{
error = 'Invalid user name/password';
}
var ret = { id:id, firstName:fn, lastName:ln, error:error};
res.status(200).json(ret);
});

// app.post('/api/login', async (req, res, next) =>
// {
//     // incoming: login, password
//     // outgoing: id, firstName, lastName, error

//     var error = '';

//     const { login, password } = req.body;

//     const db = client.db('COP4331Cards');
//     const results = await
//     db.collection('Users').find({Login:login,Password:password}).toArray();

//     var id = -1;
//     var fn = '';
//     var ln = '';

//     if( results.length > 0 )
//     {
//         id = results[0].UserID;
//         fn = results[0].FirstName;
//         ln = results[0].LastName;
//     }

//     var ret = { id:id, firstName:fn, lastName:ln, error:''};
//     res.status(200).json(ret);
// });

app.post('/api/searchcards', async (req, res, next) =>
{
    // incoming: userId, search
    // outgoing: results[], error

    var error = '';

    const { userId, search } = req.body;

    var _search = search.trim();

    const db = client.db('COP4331Cards');
    const results = await db.collection('Cards').find({"Card":{$regex:_search+'.*', $options:'i'}}).toArray();

    var _ret = [];
    for( var i=0; i<results.length; i++ )
    {
        _ret.push( results[i].Card );
    }

    var ret = {results:_ret, error:error};
    res.status(200).json(ret);
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

  const server = app.listen(5000, () => {
    console.log('Server listening on port 5000');
  });

  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await client.close();
    server.close(() => process.exit(0));
  });
}

start();
