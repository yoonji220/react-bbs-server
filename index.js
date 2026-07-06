const express = require("express");
const cors = require("cors");
const app = express();
const mysql = require("mysql2");
const port = 3000;
const multer = require("multer");

app.use(express.json()); //json->object
app.use(express.urlencoded({ extended: true })); //html form ->object
app.use("/uploads", express.static("uploads"));
// /uploads 주소로 접속시 upload 폴더에 점근 권한 부여

let corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // console.log(file);
    // console.log(file.originalname.split(".")[1]);
    const originalExt = file.originalname.split(".")[1];
    const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1000);
    cb(null, uniquePrefix + "-" + file.fieldname + "." + originalExt);
  },
});
const upload = multer({ storage: storage });

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "choiyj21338",
  database: "bbs",
});

db.connect();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/list", (req, res) => {
  const sqlQuery =
    "SELECT id, title, content, writer, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM board;";
  db.query(sqlQuery, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.get("/view", (req, res) => {
  console.log(req.query.id);
  const id = req.query.id;
  // const sqlQuery = `SELECT * FROM board WHERE id=${req.query.id};`;
  const sqlQuery =
    "SELECT title, content, writer, image_path, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM board WHERE id=?;";
  db.query(sqlQuery, [id], (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.post("/write", upload.single("image"), (req, res) => {
  console.log(req.body);
  const { title, writer, content } = req.body;
  const imagePath = req.file ? req.file.path : null; //req.file.path는 업로드된 파일의 경로
  const sqlQuery =
    "insert into board (title,content,writer,image_path) values (?,?,?,?);";
  db.query(sqlQuery, [title, content, writer, imagePath], (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.post("/delete", (req, res) => {
  console.log(req.body);
  const { id } = req.body;

  const sqlQuery = "DELETE FROM board WHERE id=?";
  db.query(sqlQuery, [id], (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.post("/deleteselect", (req, res) => {
  console.log(req.body);
  const { boardIdList } = req.body;
  const sqlQuery = `delete from board where id in (${boardIdList})`;
  db.query(sqlQuery, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.post("/update", upload.single("image"), (req, res) => {
  console.log(req.body);
  const { writer, title, content, id, remove_image } = req.body;
  const imagePath = req.file ? req.file.path : null; // 새 이미지 정보 할당
  const shouldRemoveImage = remove_image === "1";

  let sqlQuery;
  let params;

  // 상황별 sqlQuery params 정의
  if (shouldRemoveImage && !imagePath) {
    // 이미지 삭제 요청 o + 새 이미지x -> 기존 이미지 제거, image_path 값 비우기
    sqlQuery =
      "UPDATE board SET writer=?, title=?, content=?, image_path=NULL WHERE id=?";
    params = [writer, title, content, id];
  } else if (imagePath) {
    // 이미지 삭제 요청 X + 새 이미지 o -> 기존이미지 유지, image_path 새 이미지 업데이트
    sqlQuery =
      "UPDATE board SET writer=?, title=?, content=?, image_path=? WHERE id=?";
    params = [writer, title, content, imagePath, id];
  } else {
    // 이미지 삭제 요청 X + 새 이미지 X -> 이미지 유지, 글 정보만 변경
    sqlQuery = "UPDATE board SET writer=?, title=?, content=? WHERE id=?";
    params = [writer, title, content, id];
  }

  // const sqlQuery = "UPDATE board SET writer=?, title=?, content=? WHERE id=?";

  db.query(sqlQuery, params, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
