import env from "./config/env";
import app from "./app";

const port = env.port;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
