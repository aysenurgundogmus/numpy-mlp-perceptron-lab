import numpy as np

# =====================
# PERCEPTRON
# =====================
class Perceptron:
    def __init__(self, input_size, output_size):
        # Ağırlıkları küçük rastgele değerlerle başlatıyoruz
        self.W = np.random.randn(input_size, output_size) * 0.01
        self.b = np.zeros((1, output_size))

    def softmax(self, x):
        # Sayısal kararlılık (overflow önleme) için max çıkarılır
        x = x - np.max(x, axis=1, keepdims=True)
        e = np.exp(x)
        return e / np.sum(e, axis=1, keepdims=True)

    def forward(self, X):
        self.out = self.softmax(X @ self.W + self.b)
        return self.out

    def backward(self, X, y, lr):
        err = self.out - y
        self.W -= lr * (X.T @ err) / len(X)
        self.b -= lr * np.sum(err, axis=0) / len(X)

    def predict_proba(self, X):
        return self.forward(X)

    def predict(self, X):
        return np.argmax(self.predict_proba(X), axis=1)


# =====================
# MLP (Çok Katmanlı Algılayıcı)
# =====================
class MLP:
    def __init__(self, input_size, hidden_size, output_size):
        # He/Xavier benzeri küçük varyanslı başlatma
        self.W1 = np.random.randn(input_size, hidden_size) * 0.1
        self.b1 = np.zeros((1, hidden_size))

        self.W2 = np.random.randn(hidden_size, output_size) * 0.1
        self.b2 = np.zeros((1, output_size))

    def relu(self, x):
        return np.maximum(0, x)

    def softmax(self, x):
        x = x - np.max(x, axis=1, keepdims=True)
        e = np.exp(x)
        return e / np.sum(e, axis=1, keepdims=True)

    def forward(self, X):
        self.h = self.relu(X @ self.W1 + self.b1)
        self.out = self.softmax(self.h @ self.W2 + self.b2)
        return self.out

    def backward(self, X, y, lr):
        err = self.out - y

        dW2 = self.h.T @ err / len(X)
        db2 = np.sum(err, axis=0) / len(X)

        dh = err @ self.W2.T
        dh[self.h <= 0] = 0  # ReLU türevi

        dW1 = X.T @ dh / len(X)
        db1 = np.sum(dh, axis=0) / len(X)

        self.W2 -= lr * dW2
        self.b2 -= lr * db2
        self.W1 -= lr * dW1
        self.b1 -= lr * db1

    def predict_proba(self, X):
        return self.forward(X)

    def predict(self, X):
        return np.argmax(self.predict_proba(X), axis=1)