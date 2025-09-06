import torch
import numpy as np

class Vec2:
	def __init__(self, x, y):
		self.x = int(x)
		self.y = int(y)

def clamp(x, a, b):
	return max(a, min(x, b))

gridSize = 5
unitCount = 6
maxRound = 48
actionSpace = [0, 1, 2, 3]
actionCount = len(actionSpace)
actionVecs = [Vec2(1,0),Vec2(0,1),Vec2(-1,0),Vec2(0,-1)]

gridVecs = [Vec2(x,y) for x in range(gridSize) for y in range(gridSize)]
gridCount = len(gridVecs)
gridLocs = [loc for loc in range(gridCount)]

vecToLoc = np.zeros((gridSize, gridSize),dtype=np.uint8)
for loc in gridLocs:
	vec = gridVecs[loc]
	vecToLoc[vec.x, vec.y] = loc

shift = np.zeros((gridCount,actionCount),dtype=np.uint8)
for loc in gridLocs:
	for dir in actionSpace:
		gridVec = gridVecs[loc]
		actionVec = actionVecs[dir]
		x = clamp(gridVec.x + actionVec.x, 0, gridSize-1)
		y = clamp(gridVec.y + actionVec.y, 0, gridSize-1)
		shift[loc,dir] = vecToLoc[x, y]

def stateToLocs(state):
	options = gridLocs.copy()
	s = int(state)
	locs = []
	for _ in range(unitCount):
		optionCount = len(options)
		i = s % optionCount
		s = (s-i) // optionCount
		locs.append(options[i])
		del options[i] 
	return locs

stateToLocs(47625392)
stateToLocs(78768665)
