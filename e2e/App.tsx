import React from "react";
import { z } from "zod";
import { useForm } from "../src";

function App() {
  const form = useForm(z.object({ id: z.string() }), async () => {});
  return <></>;
}

export default App;
