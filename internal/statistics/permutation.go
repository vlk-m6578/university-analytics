package statistics

import "math/rand"

const permutationIterations = 1000

func PermutationANOVA(groups [][]float64) (realF, pValue float64) {
	realF, _ = ANOVA(groups...)

	pool := []float64{}
	for _, g := range groups {
		pool = append(pool, g...)
	}

	shuffled := make([][]float64, len(groups))
	count := 0

	for i := 0; i < permutationIterations; i++ {
		rand.Shuffle(len(pool), func(x, y int) {
			pool[x], pool[y] = pool[y], pool[x]
		})

		start := 0
		for j, g := range groups {
			shuffled[j] = pool[start : start+len(g)]
			start += len(g)
		}

		f, _ := ANOVA(shuffled...)
		if f >= realF-1e-12 {
			count++
		}
	}

	return realF, float64(count) / float64(permutationIterations)
}
