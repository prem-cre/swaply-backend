const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

// [
//   {
//     "id": "abc123",
//     "user1": "uid1",
//     "user2": "uid2",
//     "user1_coupon": "coupA",
//     "user2_coupon": "coupB",
//     "status": "pending",
//     "confirmedBy": [],
//     "room_id": "room123"
//   },
//   ...
// ]


router.get("/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;

    const user1Snap = await db
      .collection("trades")
      .where("user1", "==", uid)
      .get();

    const user2Snap = await db
      .collection("trades")
      .where("user2", "==", uid)
      .get();

    const allTrades = [...user1Snap.docs, ...user2Snap.docs]
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (trade) => trade.status === "pending" || trade.status === "waiting"
      );

    res.json(allTrades);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trades" });
  }
});

router.post("/upload-trade", async (req, res) => {
  try {
    const { user1, user2, user1_coupon, user2_coupon, room_id } = req.body;

    const tradeDoc = {
      user1,
      user2,
      user1_coupon,
      user2_coupon,
      room_id,
      status: "pending", // or "offered"
      createdAt: new Date(),
      confirmedBy: [],
      confirmedAt: null,
    };

    const ref = await db.collection("trades").add(tradeDoc);
    res.status(201).json({ id: ref.id, ...tradeDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create trade" });
  }
});
