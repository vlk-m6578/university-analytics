package statistics

import (
	"math"
	"math/rand"
	"sort"
)

const bootstrapIterations = 1000

type BootstrapResult struct {
	CILow        float64
	CIHigh       float64
	ProbPositive float64
}

func BootstrapDiffMeans(a, b []float64) BootstrapResult {
	diffs := make([]float64, bootstrapIterations)
	sa := make([]float64, len(a))
	sb := make([]float64, len(b))
	positive := 0

	for i := 0; i < bootstrapIterations; i++ {
		for j := range sa {
			sa[j] = a[rand.Intn(len(a))]
		}
		for j := range sb {
			sb[j] = b[rand.Intn(len(b))]
		}
		d := Mean(sa) - Mean(sb)
		diffs[i] = d
		if d > 0 {
			positive++
		}
	}

	sort.Float64s(diffs)

	return BootstrapResult{
		CILow:        percentile(diffs, 2.5),
		CIHigh:       percentile(diffs, 97.5),
		ProbPositive: float64(positive) / float64(bootstrapIterations),
	}
}

func percentile(sorted []float64, p float64) float64 {
	pos := p / 100 * float64(len(sorted)-1)
	lo := int(math.Floor(pos))
	hi := int(math.Ceil(pos))
	return sorted[lo] + (sorted[hi]-sorted[lo])*(pos-float64(lo))
}
