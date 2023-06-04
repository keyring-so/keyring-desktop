import {useState} from 'react';
import logo from './assets/images/logo-universal.png';
import './App.css';
import {Greet, Transfer} from "../wailsjs/go/main/App";

function App() {
    const [resultText, setResultText] = useState("Please enter your name below 👇");
    const [name, setName] = useState('');
    const updateName = (e: any) => setName(e.target.value);
    const updateResultText = (result: string) => setResultText(result);

    function greet() {
        Greet(name).then(updateResultText);
    }

    function transfer() {
        Transfer("", "ETH", "0xaac042fc227cf5d12f7f532bd27361d5634c06a7", "0x7fd0030d3d21d17fb4056de319fad67a853b3c20", "0.005")
            .then(updateResultText)
            .catch(err => updateResultText(err));
    }

    return (
        <div id="App">
            <img src={logo} id="logo" alt="logo"/>
            <div id="result" className="result">{resultText}</div>
            <div id="input" className="input-box">
                <input id="name" className="input" onChange={updateName} autoComplete="off" name="input" type="text"/>
                <button className="btn" onClick={greet}>Greet</button>
            </div>
            <div className="input-box">
                <br />
                <button className="btn" onClick={transfer}>Transfer</button>
            </div>
        </div>
    )
}

export default App
