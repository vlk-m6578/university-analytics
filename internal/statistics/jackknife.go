package statistics

import "math"

type JackknifeResult struct {
	BaseDiff float64
	PValues  []float64
}

func JackknifeDiffMeans(a, b []float64) JackknifeResult {
	result := JackknifeResult{BaseDiff: Mean(a) - Mean(b)}

	for i := range a {
		result.PValues = append(result.PValues, welchPValue(without(a, i), b))
	}
	for i := range b {
		result.PValues = append(result.PValues, welchPValue(a, without(b, i)))
	}

	return result
}

func without(x []float64, idx int) []float64 {
	out := make([]float64, 0, len(x)-1)
	out = append(out, x[:idx]...)
	return append(out, x[idx+1:]...)
}

func welchPValue(a, b []float64) float64 {
	if len(a) < 2 || len(b) < 2 {
		return 1
	}
	va := StdDev(a) * StdDev(a) / float64(len(a))
	vb := StdDev(b) * StdDev(b) / float64(len(b))
	if va+vb == 0 {
		return 1
	}
	t := (Mean(a) - Mean(b)) / math.Sqrt(va+vb)
	df := (va + vb) * (va + vb) / (va*va/float64(len(a)-1) + vb*vb/float64(len(b)-1))
	return regIncBeta(df/(df+t*t), df/2, 0.5)
}

func regIncBeta(x, a, b float64) float64 {
	if x <= 0 {
		return 0
	}
	if x >= 1 {
		return 1
	}
	la, _ := math.Lgamma(a + b)
	lb, _ := math.Lgamma(a)
	lc, _ := math.Lgamma(b)
	front := math.Exp(la - lb - lc + a*math.Log(x) + b*math.Log(1-x))
	if x < (a+1)/(a+b+2) {
		return front * betaContinuedFraction(x, a, b) / a
	}
	return 1 - front*betaContinuedFraction(1-x, b, a)/b
}

func betaContinuedFraction(x, a, b float64) float64 {
	const tiny = 1e-30
	c := 1.0
	d := 1 - (a+b)*x/(a+1)
	if math.Abs(d) < tiny {
		d = tiny
	}
	d = 1 / d
	h := d
	for m := 1; m <= 300; m++ {
		fm := float64(m)
		num := fm * (b - fm) * x / ((a + 2*fm - 1) * (a + 2*fm))
		d = 1 + num*d
		if math.Abs(d) < tiny {
			d = tiny
		}
		c = 1 + num/c
		if math.Abs(c) < tiny {
			c = tiny
		}
		d = 1 / d
		h *= d * c
		num = -(a + fm) * (a + b + fm) * x / ((a + 2*fm) * (a + 2*fm + 1))
		d = 1 + num*d
		if math.Abs(d) < tiny {
			d = tiny
		}
		c = 1 + num/c
		if math.Abs(c) < tiny {
			c = tiny
		}
		d = 1 / d
		delta := d * c
		h *= delta
		if math.Abs(delta-1) < 1e-12 {
			break
		}
	}
	return h
}
