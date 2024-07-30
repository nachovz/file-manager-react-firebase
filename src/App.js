import React, { useState, useRef, useEffect } from "react";
import firebase from "./firebase";
import "./App.css";

var provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({
  login_hint: "usuario@el-nacional.com",
  hd: "el-nacional.com",
});

function App() {
  const [form, setForm] = useState({
    date: "",
    pdfURL: "",
    ack: false,
    confirm: false,
  });
  const [user, setUser] = useState(() => {
    const user = firebase.auth().currentUser;
    return { initializing: !user, user };
  });
  const [progress, setProgress] = useState({
    uploading: false,
    perc: 0,
  });
  const [errors, setErrors] = useState({
    size: false,
  });
  const fileInput = useRef(null);

  function onChange(user) {
    setUser({ initializing: false, user });
  }

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(onChange);
    return () => unsubscribe();
  }, []);

  const loginHandler = () => {
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        setUser({
          username: result.user,
          token: result.credential.accessToken,
        });
        // ...
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const itemsRef = firebase.database().ref("portadas");
    itemsRef.push(form);
    setForm({
      date: "",
      pdfURL: "",
      ack: false,
      confirm: false,
      success: true,
    });
  };

  const handleChange = (event) => {
    event.persist();
    setForm((values) => ({
      ...values,
      [event.target.name]: event.target.value,
    }));
  };

  const uploadFile = (e) => {
    const file = fileInput.current.files[0];

    if (file && file.size > 3 * 1024 * 1024) {
      setErrors({
        size: true,
      });
      return null;
    }
    e.preventDefault();
    const storageRef = firebase.storage().ref();
    const portadas = storageRef.child("/portadas");
    const uploadTask = portadas
      .child(`El_Nacional_Portada_${form.date}.pdf`)
      .put(file);

    uploadTask.on(
      "state_changed",
      function (snapshot) {
        setErrors({
          size: false,
        });
        setProgress({
          uploading: true,
          perc: Math.ceil(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          ),
        });
        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED: // or 'paused'
            console.log("Upload is paused");
            break;
          case firebase.storage.TaskState.RUNNING: // or 'running'
            console.log("Upload is running");
            break;
          default:
            console.log("Unknown state");
            console.error(snapshot.state);
            break;
        }
      },
      function (error) {
        // Handle unsuccessful uploads
        setErrors({
          size: false,
        });
        console.log(error);
      },
      function () {
        setProgress({
          uploading: false,
          perc: 0,
        });
        uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
          setForm((values) => ({ ...values, pdfURL: downloadURL }));
        });
      }
    );
  };

  const logoutHandler = () => {
    firebase.auth().signOut();
  };

  return (
    <div className="container">
      <header>
        <div className="wrapper">
          <h1>Gestión de Portadas (PDF) El Nacional</h1>
        </div>
      </header>
      {form.success && (
        <div className="alert alert-success" role="alert">
          La portada ha sido actualizada con éxito! Esta es la portada que verán
          los lectores.{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://us-central1-file-manager-f2baa.cloudfunctions.net/getPortada">
            PORTADA
          </a>
          . (En caso de error, intentar subir una nueva portada)
        </div>
      )}
      {!user.user ? (
        <button onClick={() => loginHandler()} className="btn btn-success">
          Iniciar sesión con mi cuenta @el-nacional.com
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setForm((values) => ({ ...values, confirm: true }));
          }}>
          <div className="form-group">
            <label htmlFor="dateInput">
              1. Cuál es la fecha de la Portada a subir?
            </label>
            <input
              id="dateInput"
              className="form-control"
              type="date"
              name="date"
              onChange={handleChange}
              value={form.date}
            />
          </div>
          {form.date && (
            <div className="form-group">
              <label htmlFor="fileInput">
                2. Adjuntar archivo de Portada (formato válido: PDF. Tamaño
                máximo: 3 MB)
              </label>
              <div className="row">
                <div className="col">
                  <input
                    type="file"
                    className="form-control-file"
                    id="fileInput"
                    ref={fileInput}
                  />
                </div>
                <div className="col">
                  <input
                    type="button"
                    className="btn btn-primary"
                    value="Subir este archivo"
                    onClick={uploadFile}
                  />
                </div>
              </div>
            </div>
          )}
          {errors.size && (
            <div className="alert alert-danger" role="alert">
              El tamaño máximo del archivo es de 3 MB. El archivo actual es de{" "}
              {Math.round(fileInput.current.files[0].size / 1024 / 1024)} MB.
            </div>
          )}
          {progress.uploading && (
            <div className="progress">
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${progress.perc}%` }}
                aria-valuenow={progress.perc}
                aria-valuemin="0"
                aria-valuemax="100">
                {progress.perc}%
              </div>
            </div>
          )}

          {form.pdfURL && (
            <div className="form-group">
              <label>3. Es este el archivo correcto? </label>
              <div className="row">
                <div className="col-6">
                  <embed
                    width="191"
                    height="300"
                    name="plugin"
                    src={form.pdfURL}
                    type="application/pdf"
                  />
                </div>
                <div className="col-6">
                  <span
                    className="btn btn-success btn-lg btn-block"
                    onClick={() =>
                      setForm((values) => ({ ...values, ack: true }))
                    }>
                    Si, es el correcto
                  </span>
                  <br />
                  <span
                    className="btn btn-danger btn-lg btn-block"
                    onClick={() =>
                      setForm((values) => ({ ...values, pdfURL: "" }))
                    }>
                    No, quiero subir otro
                  </span>
                </div>
              </div>
            </div>
          )}
          <hr />
          {form.ack && (
            <input
              className="btn btn-primary btn-lg btn-block"
              type="submit"
              value="Publicar nueva portada"
            />
          )}
        </form>
      )}
      <div
        className={`modal fade ${form.ack && form.confirm && "show"}`}
        style={{
          display: form.ack && form.confirm && "block",
          paddingTop: "20vh",
          background: "#00000082",
        }}
        tabindex="-1"
        aria-modal="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Confirmar
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">¿Está seguro(a) de la información?</div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-danger"
                data-dismiss="modal"
                onClick={() =>
                  setForm((values) => ({ ...values, ack: false }))
                }>
                No, volver
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleSubmit}>
                Si, publicar nueva portada
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
