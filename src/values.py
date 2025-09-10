import torch
import numpy as np
import os

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print("device = " + str(device))

def clamp(x, a, b):
	return max(a, min(x, b))

gridSize = 5
unitCount = 6
units = torch.arange(unitCount, dtype=torch.int32).to(device)
myUnits = torch.tensor([0,2,4], dtype=torch.int32).to(device)
otherUnits = torch.tensor([1,3,5], dtype=torch.int32).to(device)
maxRound = 48
actionSpace = torch.tensor([0, 1, 2, 3], dtype=torch.int).to(device)
actionCount = 4
actionVecs = torch.tensor([[1,0],[0,1],[-1,0],[0,-1]], dtype=torch.int).to(device)
gridVecs = torch.tensor(
	[[x,y] for x in range(gridSize) for y in range(gridSize)],
	dtype=torch.int
).to(device)
gridCount = gridVecs.size()[0]
gridLocs = torch.tensor([loc for loc in range(gridCount)], dtype=torch.int).to(device)

vecToLoc = torch.zeros((gridSize, gridSize),dtype=torch.int).to(device)
for loc in gridLocs:
	vec = gridVecs[loc]
	vecToLoc[vec[0], vec[1]] = loc

shift = torch.zeros((gridCount,actionCount),dtype=torch.int).to(device)
for loc in gridLocs:
	for dir in actionSpace:
		gridVec = gridVecs[loc]
		actionVec = actionVecs[dir]
		x = clamp(gridVec[0] + actionVec[0], 0, gridSize-1)
		y = clamp(gridVec[1] + actionVec[1], 0, gridSize-1)
		shift[loc,dir] = vecToLoc[x, y]

def moveToEnd(tensor_1d: torch.Tensor, index: int):
	indices = torch.arange(tensor_1d.size()[0]).to(device)
	matches = torch.where(indices==index,1,0)
	sorted_indices = torch.argsort(matches, stable=True)
	sorted = torch.gather(tensor_1d, 0, sorted_indices)
	return sorted

def stateToLocs(state: torch.Tensor):
	options = gridLocs.clone()
	s = state
	locs = torch.tensor([], dtype=torch.int).to(device)
	for unitIndex in range(unitCount):
		optionCount = gridCount - unitIndex
		i = (s % optionCount).view(1)
		s = (s-i) // optionCount
		locs = torch.cat((locs, options[i]))
		options = moveToEnd(options,i)
	return locs

optionCounts = torch.tensor(
	[gridCount - r for r in range(unitCount)], 
	dtype=torch.int32
).to(device)

stateCount = torch.prod(optionCounts,dtype=torch.int32).to(device)

coefficients = torch.tensor(
	[torch.prod(optionCounts[0:i]) for i in range(unitCount)],
	dtype=torch.int32
).to(device)

def locsToState (locs: torch.Tensor):
	options = gridLocs.clone()
	total = 0
	for unitIndex in range(unitCount):
		loc = locs[unitIndex]
		matches = (options == loc).long()
		optionIndex = torch.argmax(matches)
		options = moveToEnd(options,optionIndex)
		coefficient = coefficients[unitIndex]
		total += optionIndex * coefficient
	return total.to(dtype=torch.int32)

def isin(x: torch.Tensor, y: torch.Tensor):
	return (x == y.unsqueeze(-1)).any(dim=0)

def getOutcome (state: torch.Tensor, action: torch.Tensor):
	locs = stateToLocs(state)
	stepLoc = locs[0].clone().view(1)
	path = torch.tensor([], dtype=torch.int).to(device)
	for _ in range(gridSize):
		path = torch.cat((path,stepLoc))
		stepLoc = shift[stepLoc.view(1),action.view(1)]
	occupied = isin(path,locs)
	blocked = torch.all(occupied)
	moving = torch.cumprod(isin(locs,path),0).to(torch.bool) 
	moving = moving & ~blocked
	shifted = shift[locs, action.view(1)]
	moved = torch.where(moving, shifted, locs)
	cycled = moveToEnd(moved, 0)
	return locsToState(cycled)

def getOutcomeVector(state: torch.Tensor):
	return torch.vmap(getOutcome, in_dims=(None, 0))(state, actionSpace)

def getOutcomes(states: torch.Tensor):
	return torch.vmap(getOutcomeVector)(states)

scoreValues = 100*torch.ones((3,3), dtype=torch.uint8).to(device)
scoreValues[2,:] = 200
scoreValues[:,2] = 0

def getEndValue (goals: torch.Tensor, state: torch.Tensor):
	locs = stateToLocs(state)
	myLocs = locs[myUnits]
	otherLocs = locs[otherUnits]
	myScore = isin(goals,myLocs).sum()
	otherScore = isin(goals,otherLocs).sum()
	return scoreValues[myScore.view(1), otherScore.view(1)].squeeze()

def getEndValues (goals: torch.Tensor, states: torch.Tensor):
	f = torch.vmap(
		getEndValue, 
		in_dims=(None, 0), 
		chunk_size=stateCount // 50
	)
	return f(goals, states)

os.system('clear')

# testing with a small number of states

goals = torch.tensor([12, 13],dtype=torch.int).to(device)
states = torch.arange(stateCount,dtype=torch.int32).to(device)

state = states[63032467]
getOutcome(state,actionSpace[3])
getEndValue(goals, state)
getOutcomeVector(state)

testStates = states[63032467:63032470]
testOutcomes = getOutcomes(testStates)
testValues = getEndValues(goals, testStates)

# run with the full set of states

states = torch.arange(stateCount,dtype=torch.int32).to(device)
goals = torch.tensor([12, 13],dtype=torch.int).to(device)
values = getEndValues(goals, states)

values.cpu().numpy().tofile('values.bin')

# state 63032467
# locs [ 17, 2, 14, 15, 22, 10 ]
# vectors [
#   { x: 3, y: 2 },
#   { x: 0, y: 2 },
#   { x: 2, y: 4 },
#   { x: 3, y: 0 },
#   { x: 4, y: 2 },
#   { x: 2, y: 0 }
# ]
# action 3
# outcome 79509927

# Update all function to be compatible with vmap
# Construct the initial value tensor using torch.vmap
# Perform value interation using torch.vmap

# [0  1  3  4  5  6  7  8  9 10 11 12 14 15 16 18 19 20 21 22 23 24]
# [0  1  3  4  5  6  7  8  9 10 11 12 13 16 18 19 20 21 22 23 24]
