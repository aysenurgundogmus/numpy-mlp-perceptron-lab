from flask import Flask, request, jsonify, render_template
import numpy as np
import pandas as pd
from model import MLP, Perceptron

app = Flask(__name__)
model = None

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/train", methods=["POST"])
def train():
    global model

    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "CSV dosyası seçilmedi!"}), 400

        lr = float(request.form.get("lr", 0.1))
        epoch = int(request.form.get("epoch", 20))
        model_type = request.form.get("model", "mlp")

        df = pd.read_csv(file, nrows=10000)

        y_raw = df.iloc[:, 0].values.astype(int)
        X = df.iloc[:, 1:].values.astype(np.float32)

        if X.max() > 1.0:
            X = X / 255.0

        # EMNIST yönelim düzeltmesi (28x28 transpoze işlemi)
        if X.shape[1] == 784:
            X = X.reshape(-1, 28, 28).transpose(0, 2, 1).reshape(-1, 784)

        unique_labels = np.unique(y_raw)
        classes = len(unique_labels)
        label_map = {val: idx for idx, val in enumerate(unique_labels)}
        y_mapped = np.array([label_map[v] for v in y_raw])

        y = np.eye(classes)[y_mapped]
        input_size = X.shape[1]

        if model_type == "mlp":
            model = MLP(input_size, 128, classes)
        else:
            model = Perceptron(input_size, classes)

        acc_list = []
        loss_list = []
        batch_size = 64
        num_samples = len(X)

        for _ in range(epoch):
            # Her epoch'ta veriyi karıştır (Shuffle)
            indices = np.random.permutation(num_samples)
            X_shuffled = X[indices]
            y_shuffled = y[indices]

            # Mini-Batch Gradient Descent
            for i in range(0, num_samples, batch_size):
                X_batch = X_shuffled[i:i + batch_size]
                y_batch = y_shuffled[i:i + batch_size]
                model.forward(X_batch)
                model.backward(X_batch, y_batch, lr)

            # Epoch sonu genel değerlendirme
            out = model.forward(X)
            pred = np.argmax(out, axis=1)
            acc = float(np.mean(pred == y_mapped))
            loss = float(np.mean((y - out) ** 2))

            acc_list.append(round(acc * 100, 2))
            loss_list.append(round(loss, 4))

        return jsonify({
            "status": "success",
            "acc": acc_list,
            "loss": loss_list,
            "final_acc": acc_list[-1],
            "final_loss": loss_list[-1],
            "samples": num_samples,
            "features": input_size
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict", methods=["POST"])
def predict():
    global model
    if model is None:
        return jsonify({"error": "Model henüz eğitilmedi!"}), 400

    try:
        data = request.json.get("image")
        if not data:
            return jsonify({"error": "Görüntü verisi alınamadı!"}), 400

        x = np.array(data, dtype=np.float32).reshape(1, -1)

        if x.max() > 1.0:
            x = x / 255.0

        probs = model.predict_proba(x)[0].tolist()
        pred = int(np.argmax(probs))

        return jsonify({
            "prediction": pred,
            "probabilities": [round(p * 100, 2) for p in probs]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5009)
