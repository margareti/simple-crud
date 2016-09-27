
function Collection(obj) {
  for (const element in obj) {
    if ({}.hasOwnProperty.call(obj, element)) {
      this[element] = obj[element];
    }
  }
}

Collection.url = 'http://jsonplaceholder.typicode.com/todos';

Collection.list = function list() {
  const result = [];
  const prom = fetch(this.url, {
    method: 'GET',
  })
	.then(r => r.json())
	.then((data) => {
  data.forEach((x) => {
    result.push(new this(x));
  });
  return result;
	})
  .catch((error) => error);
  return prom;
};

Collection.get = function get(id) {
  const post = fetch(`${this.url}/${id}`, {
    method: 'GET',
  })
  .then(r => {
    if (r.status >= 400 && r.status < 500) {
      throw new Error(r.statusText);
    }
    return r.json();
  })
  .then(data => new this(data))
  .catch(error => {
    console.log(error);
    return false;
  });
  return post;
};

Collection.prototype.save = function save() {
  let post;
  const url = Collection.url;
  if (!this.hasOwnProperty('id')) {
    post = fetch(url, {
      method: 'POST',
      body: this,
    })
    .then(r => r.json())
    .then(data => {
      this.id = data.id;
    });
  } else {
    const changes = compare(this);
    post = fetch(`${url}/${this.id}`, {
      method: 'PATCH',
      body: changes,
    });
  }
  return post
  .then(() => null)
  .catch(error => error);
};

function clone(obj) {
  const newOb = {};
  const keys = Object.keys(obj);
  let i;

  function cloneArray(arr) {
    const newArr = [];
    let ii;
    for (ii = 0; ii < arr.length; ii ++) {
      if (typeof(arr[ii]) === 'object') {
        newArr[ii] = clone(arr[ii]);
      } else {
        newArr[ii] = arr[ii];
      }
    }
    return newArr;
  }
  for (i = 0; i < keys.length; i++) {
    if (typeof(obj[keys[i]]) === 'object') {
      newOb[keys[i]] = Array.isArray(obj[keys[i]]) ? cloneArray(obj[keys[i]]) : clone(obj[keys[i]]);
    } else {
      newOb[keys[i]] = obj[keys[i]];
    }
  }
  return newOb;
}

function populateResult(path, obj) {
  let current;
  const result = obj;
  let cursor = result;
  const history = [];
  path.forEach(x => history.push(x));

  while (history.length > 0) {
    current = history.shift();
    if (!cursor.hasOwnProperty(current)) {
      cursor[current] = {};
    }
    cursor = cursor[current];
  }
  return [result, cursor];
}

function getDifference(obj, backup, history = [], intObj = {}) {
  let result = [];
  result[0] = intObj;

  for (const key in obj) {
    if (typeof(obj[key]) === 'object') {
      if (key !== '_backup') {
        const historyCopy = [];
        history.forEach(x => historyCopy.push(x));
        historyCopy.push(key);
        getDifference(obj[key], backup[key], historyCopy, result[0]);
      }
    } else if (obj[key] !== backup[key]) {
      result = populateResult(history, intObj);
      result[1][key] = obj[key];
    }
  }
  return result[0];
}

function backUp(obj) {
  const backupObj = clone(obj);
  return backupObj;
}

function compare(obj) {
  if (!obj.hasOwnProperty('_backup')) {
    obj['_backup'] = backUp(obj);
    return {};
  }
  return getDifference(obj, obj['_backup']);
}

function isEmailValid(obj) {
  if (!obj.hasOwnProperty('email')) {
    return false;
  }
  const regx = /[\w\d.]+@[\w\d]+.[\w\S]{2,5}/gi;
  return regx.test(obj.email);
}


function parseData(arr, id, property) {
  const relevant = [];
  arr.forEach((x) => {
    if (x[property] === id) {
      relevant.push(x);
    }
  });
  return relevant;
}

function User(obj) {
  Collection.call(this, obj);
}
User.prototype = Object.create(Collection.prototype);

User.url = 'http://jsonplaceholder.typicode.com/users';
User.list = Collection.list;
User.get = Collection.get;

User.prototype.save = function save() {
  let post;
  const url = User.url;
  if (this.hasOwnProperty('name') && this.hasOwnProperty('username') && isEmailValid(this)) {
    const changes = compare(this);
    post = fetch(`${url}/${this.id}`, {
      method: 'PATCH',
      body: changes,
    });
  }
  return post
  .then(() => null)
  .catch(error => error);
};

User.prototype.getAlbums = function getAlbums() {
  return Album.list()
  .then((data) => {
    const result = parseData(data, this.id, 'userId');
    return result;
  });
};

function Album(obj) {
  Collection.call(this, obj);
}
Album.prototype = Object.create(Collection.prototype);

Album.url = 'http://jsonplaceholder.typicode.com/albums';
Album.list = Collection.list;
Album.get = Collection.get;

Album.prototype.save = function save() {
  let post;
  const url = Album.url;
  if (this.hasOwnProperty('userId') && this.hasOwnProperty('title')) {
    const changes = compare(this);
    console.log('changes are ', changes);
    console.log(url);
    post = fetch(`${url}/${this.id}`, {
      method: 'PATCH',
      body: changes,
    });
  }
  return post
  .then(() => null)
  .catch(error => error);
};

Album.prototype.getPhotos = function getPhotos() {
  return Photo.list()
  .then(data => {
    const result = parseData(data, this.id, 'albumId');
    return result;
  });
};

function Photo(obj) {
  Collection.call(this, obj);
}
Photo.prototype = Object.create(Collection.prototype);

Photo.list = Collection.list;
Photo.url = 'http://jsonplaceholder.typicode.com/photos';

function populateData(arr, property) {
  const usersList = document.createElement('ul');
  arr.forEach((x) => {
    const el = document.createElement('li');
    el.dataset.id = x.id;
    el.textContent = x[property];
    usersList.appendChild(el);
  });
  return usersList;
}

function populateLinks(arr) {
  const albumsList = document.createElement('ul');
  arr.forEach((x) => {
    const el = document.createElement('li');
    const link = document.createElement('a');
    const img = document.createElement('img');
    const text = document.createElement('span');
    el.appendChild(link);
    link.href = x.thumbnailUrl;
    link.target = '_blank';
    img.src = x.thumbnailUrl;
    text.textContent = x.title;
    link.appendChild(img);
    link.appendChild(text);
    albumsList.appendChild(el);
  });
  return albumsList;
}


function addListeners(arr) {
  arr.forEach(x => {
    x.addEventListener('click', (ev) => {
      if (arr.indexOf(ev.target) >= 0 && !ev.target.dataset.active) {
        const current = ev.target;
        Album.get(current.dataset.id)
        .then(data => data.getPhotos())
        .then(data => {
          const relevantLinks = populateLinks(data);
          current.appendChild(relevantLinks);
          relevantLinks.classList.add('photos');
          current.dataset.active = true;
          relevantLinks.addEventListener('click', (e) => {
            e.stopPropagation();
          });
        });
      }
    });
  });
}

const usersData = User.list();

usersData.then(data => {
  const usersList = populateData(data, 'name');
  document.querySelector('.main').appendChild(usersList);
  usersList.classList.add('users');
});

const main = document.querySelector('.main');
main.addEventListener('click', (ev) => {
  const usersList = [...main.querySelector('.users').children];

  if (usersList.indexOf(ev.target) >= 0 && !ev.target.dataset.active) {
    const currentUserItem = ev.target;
    const id = parseInt(currentUserItem.dataset.id, 10);

    User.get(id)
		.then(data => {
      if (data) {
        return data.getAlbums();
      }
      return false;
		})
		.then(data => {
      const childAlbumsHTML = populateData(data, 'title');
      currentUserItem.appendChild(childAlbumsHTML);
      const albumLi = [...currentUserItem.querySelectorAll('li')];
      addListeners(albumLi);
      currentUserItem.dataset.active = true;
		});
  }
});

