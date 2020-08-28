// get user id
const myPeerId = location.hash.slice(1);
console.log(myPeerId);

// create new user and establish connection to server
let peer = new Peer(myPeerId, { host: "glajan.com", port: 8443, path: "/myapp", secure: true});

// add callbacks for peer events
peer.on("open", (id) => {
    document.querySelector(".my-peer-id").innerHTML = id;
});
peer.on("error",  (error) => {
    console.log(error);
});

// handle user list
const allPeersButton = document.querySelector(".list-all-peers-button");
allPeersButton.addEventListener("click", () => {
    const peerListDiv = document.querySelector(".peers");
    // remove old list(s), if any
    while (peerListDiv.hasChildNodes()) {
        peerListDiv.removeChild(peerListDiv.firstChild);
    }
    // create new list
    const peerList = document.createElement("ul");
    // populate new peer list (peer is the file global object)
    peer.listAllPeers((peers) => {
        // filter out own id
        const filteredPeers = peers.filter((peerId) => peerId !== myPeerId);
        // add a list item for each peer
        filteredPeers.forEach((peerId) => {
            // create necessary elements
            const peerItem = document.createElement("li");
            const peerButton = document.createElement("button");
            // configure button
            peerButton.innerText = peerId;
            peerButton.classList.add("connect-button");
            peerButton.classList.add(`peerId-${peerId}`);
            // add elements
            peerItem.appendChild(peerButton);
            peerList.appendChild(peerItem);
        });
    });
    // append the new peerList
    peerListDiv.appendChild(peerList);
}); 
