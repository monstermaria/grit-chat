// just a comment, to show i know how to push to git :)
// and another one, just for fun...
// blaha

const peerOnOpen = (id) => {
    document.querySelector('.my-peer-id').innerHTML = id;
}

const myPeerId = location.hash.slice(1);
console.log(myPeerId);

let peer = new Peer(myPeerId, { host: 'glajan.com', port: 8443, path: '/myapp', secure: true});

peer.on('open', peerOnOpen);


